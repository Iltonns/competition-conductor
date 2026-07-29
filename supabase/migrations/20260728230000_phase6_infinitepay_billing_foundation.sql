-- Fase 6 / F6-RF02: pedidos de checkout, eventos idempotentes e confirmacao
-- autoritativa de pagamentos InfinitePay.

CREATE TABLE public.billing_checkout_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_version_id uuid NOT NULL REFERENCES public.saas_plan_versions(id) ON DELETE RESTRICT,
  provider text NOT NULL DEFAULT 'infinitepay' CHECK (provider = 'infinitepay'),
  order_nsu text NOT NULL UNIQUE,
  client_request_id uuid NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'BRL' CHECK (currency = 'BRL'),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'checkout_created', 'paid', 'failed', 'cancelled', 'expired')),
  checkout_url text,
  invoice_slug text,
  transaction_nsu text,
  receipt_url text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (organization_id, client_request_id)
);

CREATE UNIQUE INDEX billing_checkout_orders_transaction_key
  ON public.billing_checkout_orders(provider, transaction_nsu)
  WHERE transaction_nsu IS NOT NULL;
CREATE INDEX billing_checkout_orders_org_created_idx
  ON public.billing_checkout_orders(organization_id, created_at DESC);

CREATE TRIGGER billing_checkout_orders_updated_at
  BEFORE UPDATE ON public.billing_checkout_orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.billing_provider_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider = 'infinitepay'),
  event_key text NOT NULL,
  order_nsu text NOT NULL,
  transaction_nsu text,
  invoice_slug text,
  amount_cents integer,
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processed', 'ignored', 'failed')),
  error_code text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE (provider, event_key)
);

CREATE INDEX billing_provider_events_order_idx
  ON public.billing_provider_events(provider, order_nsu, received_at DESC);

ALTER TABLE public.billing_checkout_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_provider_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.billing_checkout_orders, public.billing_provider_events
  FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.billing_checkout_orders, public.billing_provider_events TO service_role;

CREATE OR REPLACE FUNCTION public.prepare_subscription_checkout(
  p_organization_id uuid,
  p_plan_version_id uuid,
  p_client_request_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  selected_plan public.saas_plan_versions%ROWTYPE;
  checkout_order public.billing_checkout_orders%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'billing:authentication_required';
  END IF;
  IF public.organization_effective_role(p_organization_id, auth.uid()) <> 'owner' THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'billing:owner_required';
  END IF;

  SELECT * INTO selected_plan
  FROM public.saas_plan_versions
  WHERE id = p_plan_version_id
    AND status = 'active'
    AND effective_from <= now()
    AND monthly_price_cents > 0;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'billing:plan_not_available';
  END IF;

  INSERT INTO public.billing_checkout_orders(
    organization_id, plan_version_id, order_nsu, client_request_id,
    amount_cents, currency, created_by
  )
  VALUES (
    p_organization_id,
    selected_plan.id,
    gen_random_uuid()::text,
    p_client_request_id,
    selected_plan.monthly_price_cents,
    selected_plan.currency,
    auth.uid()
  )
  ON CONFLICT (organization_id, client_request_id) DO UPDATE
    SET organization_id = EXCLUDED.organization_id
  RETURNING * INTO checkout_order;

  IF checkout_order.plan_version_id <> selected_plan.id THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'billing:idempotency_conflict';
  END IF;

  RETURN jsonb_build_object(
    'id', checkout_order.id,
    'order_nsu', checkout_order.order_nsu,
    'amount_cents', checkout_order.amount_cents,
    'currency', checkout_order.currency,
    'description', selected_plan.name || ' - mensalidade',
    'checkout_url', checkout_order.checkout_url,
    'status', checkout_order.status
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.attach_subscription_checkout_url(
  p_order_id uuid,
  p_checkout_url text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  checkout_order public.billing_checkout_orders%ROWTYPE;
BEGIN
  IF p_checkout_url !~ '^https://checkout\.infinitepay\.com\.br/' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'billing:invalid_checkout_url';
  END IF;

  UPDATE public.billing_checkout_orders checkout
  SET checkout_url = p_checkout_url, status = 'checkout_created'
  WHERE checkout.id = p_order_id
    AND public.organization_effective_role(checkout.organization_id, auth.uid()) = 'owner'
    AND checkout.status IN ('pending', 'checkout_created')
  RETURNING * INTO checkout_order;

  IF checkout_order.id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'billing:checkout_not_found';
  END IF;
  RETURN jsonb_build_object('url', checkout_order.checkout_url);
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_infinitepay_subscription_payment(
  p_event_key text,
  p_order_nsu text,
  p_transaction_nsu text,
  p_invoice_slug text,
  p_amount_cents integer,
  p_receipt_url text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  checkout_order public.billing_checkout_orders%ROWTYPE;
  event_id uuid;
  period_start timestamptz := now();
  updated_subscriptions integer;
BEGIN
  INSERT INTO public.billing_provider_events(
    provider, event_key, order_nsu, transaction_nsu, invoice_slug, amount_cents
  )
  VALUES (
    'infinitepay', p_event_key, p_order_nsu, p_transaction_nsu,
    p_invoice_slug, p_amount_cents
  )
  ON CONFLICT (provider, event_key) DO NOTHING
  RETURNING id INTO event_id;

  IF event_id IS NULL THEN
    RETURN jsonb_build_object('processed', false, 'duplicate', true);
  END IF;

  SELECT * INTO checkout_order
  FROM public.billing_checkout_orders
  WHERE provider = 'infinitepay' AND order_nsu = p_order_nsu
  FOR UPDATE;

  IF NOT FOUND OR checkout_order.amount_cents <> p_amount_cents THEN
    UPDATE public.billing_provider_events
    SET status = 'failed', error_code = 'order_or_amount_mismatch', processed_at = now()
    WHERE id = event_id;
    RETURN jsonb_build_object(
      'processed', false,
      'duplicate', false,
      'error', 'billing:payment_mismatch'
    );
  END IF;

  IF checkout_order.status = 'paid' THEN
    UPDATE public.billing_provider_events
    SET status = 'ignored', processed_at = now()
    WHERE id = event_id;
    RETURN jsonb_build_object('processed', false, 'duplicate', true);
  END IF;

  UPDATE public.organization_subscriptions
  SET plan_version_id = checkout_order.plan_version_id,
      status = 'active',
      current_period_starts_at = CASE
        WHEN plan_version_id = checkout_order.plan_version_id
          AND current_period_ends_at > period_start
          THEN current_period_starts_at
        ELSE period_start
      END,
      current_period_ends_at = CASE
        WHEN plan_version_id = checkout_order.plan_version_id
          AND current_period_ends_at > period_start
          THEN current_period_ends_at + interval '1 month'
        ELSE period_start + interval '1 month'
      END,
      cancelled_at = NULL,
      suspended_at = NULL,
      provider = 'infinitepay',
      provider_subscription_id = checkout_order.order_nsu,
      updated_at = period_start
  WHERE organization_id = checkout_order.organization_id;

  GET DIAGNOSTICS updated_subscriptions = ROW_COUNT;
  IF updated_subscriptions <> 1 THEN
    UPDATE public.billing_checkout_orders
    SET status = 'failed'
    WHERE id = checkout_order.id;
    UPDATE public.billing_provider_events
    SET status = 'failed', error_code = 'subscription_not_found', processed_at = now()
    WHERE id = event_id;
    RETURN jsonb_build_object(
      'processed', false,
      'duplicate', false,
      'error', 'billing:subscription_not_found'
    );
  END IF;

  UPDATE public.billing_checkout_orders
  SET status = 'paid', transaction_nsu = p_transaction_nsu,
      invoice_slug = p_invoice_slug, receipt_url = p_receipt_url, paid_at = period_start
  WHERE id = checkout_order.id;

  INSERT INTO public.admin_audit_logs(
    action, actor_user_id, target_type, target_id, reason, context, new_data
  )
  VALUES (
    'subscription.payment_confirmed',
    NULL,
    'organization_subscription',
    checkout_order.organization_id::text,
    'Pagamento confirmado por verificacao ativa na InfinitePay.',
    jsonb_build_object('provider', 'infinitepay', 'order_nsu', p_order_nsu),
    jsonb_build_object(
      'plan_version_id', checkout_order.plan_version_id,
      'amount_cents', p_amount_cents,
      'transaction_nsu', p_transaction_nsu
    )
  );

  UPDATE public.billing_provider_events
  SET status = 'processed', processed_at = now()
  WHERE id = event_id;

  RETURN jsonb_build_object('processed', true, 'duplicate', false);
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_subscription_checkout(uuid, uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.prepare_subscription_checkout(uuid, uuid, uuid)
  TO authenticated;
REVOKE ALL ON FUNCTION public.attach_subscription_checkout_url(uuid, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.attach_subscription_checkout_url(uuid, text)
  TO authenticated;
REVOKE ALL ON FUNCTION public.confirm_infinitepay_subscription_payment(
  text, text, text, text, integer, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_infinitepay_subscription_payment(
  text, text, text, text, integer, text
) TO service_role;
