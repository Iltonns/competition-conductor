-- Fase 5: financeiro real, auditado e isolado por organizacao/campeonato.
-- Registros financeiros nao sao apagados fisicamente. A retencao minima
-- recomendada e de cinco anos; cancelamentos e estornos preservam o historico.

CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  championship_id uuid REFERENCES public.championships(id) ON DELETE RESTRICT,
  transaction_type text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  competence_date date NOT NULL,
  occurred_on date NOT NULL DEFAULT current_date,
  due_date date,
  due_on date,
  paid_at timestamptz,
  paid_on date,
  amount numeric(14,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  counterparty text,
  notes text,
  source_type text,
  source_id uuid,
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  cancellation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- O projeto remoto ja possuia uma tabela financeira legada com occurred_on,
-- due_on e paid_on. CREATE TABLE IF NOT EXISTS nao reconcilia colunas, portanto
-- todas as colunas consumidas pela Fase 5 precisam ser adicionadas antes de
-- qualquer indice, constraint, trigger ou RPC que as referencie.
ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS competence_date date,
  ADD COLUMN IF NOT EXISTS occurred_on date,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS due_on date,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_on date,
  ADD COLUMN IF NOT EXISTS counterparty text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS source_id uuid,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

DO $$
DECLARE
  has_occurred_on boolean;
  has_due_on boolean;
  has_paid_on boolean;
  has_metadata boolean;
  has_payment_id boolean;
  has_referee_assignment_id boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_transactions'
      AND column_name = 'occurred_on'
  ) INTO has_occurred_on;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_transactions'
      AND column_name = 'due_on'
  ) INTO has_due_on;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_transactions'
      AND column_name = 'paid_on'
  ) INTO has_paid_on;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_transactions'
      AND column_name = 'metadata'
  ) INTO has_metadata;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_transactions'
      AND column_name = 'payment_id'
  ) INTO has_payment_id;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_transactions'
      AND column_name = 'referee_assignment_id'
  ) INTO has_referee_assignment_id;

  IF has_occurred_on THEN
    EXECUTE $sql$
      UPDATE public.financial_transactions
      SET competence_date = COALESCE(competence_date, occurred_on::date, created_at::date)
      WHERE competence_date IS NULL
    $sql$;
  ELSE
    UPDATE public.financial_transactions
    SET competence_date = COALESCE(competence_date, created_at::date)
    WHERE competence_date IS NULL;
  END IF;

  IF has_due_on THEN
    EXECUTE $sql$
      UPDATE public.financial_transactions
      SET due_date = due_on::date
      WHERE due_date IS NULL AND due_on IS NOT NULL
    $sql$;
  END IF;

  IF has_paid_on THEN
    EXECUTE $sql$
      UPDATE public.financial_transactions
      SET paid_at = paid_on::timestamptz
      WHERE paid_at IS NULL AND paid_on IS NOT NULL
    $sql$;
  END IF;

  IF has_metadata THEN
    EXECUTE $sql$
      UPDATE public.financial_transactions
      SET
        counterparty = COALESCE(
          counterparty,
          NULLIF(btrim((metadata::jsonb)->>'counterparty'), '')
        ),
        notes = COALESCE(notes, NULLIF(btrim((metadata::jsonb)->>'notes'), ''))
      WHERE jsonb_typeof(metadata::jsonb) = 'object'
    $sql$;
  END IF;

  IF has_payment_id THEN
    EXECUTE $sql$
      UPDATE public.financial_transactions
      SET source_type = 'payment', source_id = payment_id
      WHERE source_type IS NULL AND source_id IS NULL AND payment_id IS NOT NULL
    $sql$;
  END IF;

  IF has_referee_assignment_id THEN
    EXECUTE $sql$
      UPDATE public.financial_transactions
      SET source_type = 'referee_assignment', source_id = referee_assignment_id
      WHERE source_type IS NULL AND source_id IS NULL
        AND referee_assignment_id IS NOT NULL
    $sql$;
  END IF;

  UPDATE public.financial_transactions
  SET
    occurred_on = COALESCE(occurred_on, competence_date),
    due_on = COALESCE(due_on, due_date),
    paid_on = CASE
      WHEN status = 'paid' THEN COALESCE(paid_on, paid_at::date)
      ELSE NULL
    END;
END
$$;

DO $$
DECLARE
  invalid_statuses text;
  invalid_types text;
BEGIN
  SELECT string_agg(DISTINCT status, ', ' ORDER BY status)
  INTO invalid_statuses
  FROM public.financial_transactions
  WHERE status NOT IN ('pending', 'paid', 'cancelled');

  IF invalid_statuses IS NOT NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'finance:unsupported_legacy_status',
      DETAIL = invalid_statuses;
  END IF;

  SELECT string_agg(DISTINCT transaction_type, ', ' ORDER BY transaction_type)
  INTO invalid_types
  FROM public.financial_transactions
  WHERE transaction_type NOT IN ('income', 'expense');

  IF invalid_types IS NOT NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'finance:unsupported_legacy_transaction_type',
      DETAIL = invalid_types;
  END IF;

  UPDATE public.financial_transactions
  SET
    paid_at = CASE
      WHEN status = 'paid' THEN COALESCE(paid_at, updated_at, created_at)
      ELSE NULL
    END,
    cancelled_at = CASE
      WHEN status = 'cancelled' THEN COALESCE(cancelled_at, updated_at, created_at)
      ELSE NULL
    END,
    cancelled_by = CASE WHEN status = 'cancelled' THEN cancelled_by ELSE NULL END,
    cancellation_reason = CASE
      WHEN status = 'cancelled'
        THEN COALESCE(cancellation_reason, 'Migrado do financeiro legado')
      ELSE NULL
    END;
END
$$;

ALTER TABLE public.financial_transactions
  ALTER COLUMN competence_date SET NOT NULL,
  ALTER COLUMN occurred_on SET NOT NULL,
  ALTER COLUMN occurred_on SET DEFAULT current_date;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.financial_transactions'::regclass
      AND conname = 'financial_transactions_type_check'
  ) THEN
    ALTER TABLE public.financial_transactions
      ADD CONSTRAINT financial_transactions_type_check
      CHECK (transaction_type IN ('income', 'expense'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.financial_transactions'::regclass
      AND conname = 'financial_transactions_category_check'
  ) THEN
    ALTER TABLE public.financial_transactions
      ADD CONSTRAINT financial_transactions_category_check
      CHECK (char_length(btrim(category)) BETWEEN 2 AND 80);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.financial_transactions'::regclass
      AND conname = 'financial_transactions_description_check'
  ) THEN
    ALTER TABLE public.financial_transactions
      ADD CONSTRAINT financial_transactions_description_check
      CHECK (char_length(btrim(description)) BETWEEN 3 AND 240);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.financial_transactions'::regclass
      AND conname = 'financial_transactions_amount_check'
  ) THEN
    ALTER TABLE public.financial_transactions
      ADD CONSTRAINT financial_transactions_amount_check CHECK (amount > 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.financial_transactions'::regclass
      AND conname = 'financial_transactions_status_check'
  ) THEN
    ALTER TABLE public.financial_transactions
      ADD CONSTRAINT financial_transactions_status_check
      CHECK (status IN ('pending', 'paid', 'cancelled'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.financial_transactions'::regclass
      AND conname = 'financial_transactions_paid_state_check'
  ) THEN
    ALTER TABLE public.financial_transactions
      ADD CONSTRAINT financial_transactions_paid_state_check CHECK (
        (status = 'paid' AND paid_at IS NOT NULL AND cancelled_at IS NULL)
        OR (status = 'cancelled' AND paid_at IS NULL AND cancelled_at IS NOT NULL)
        OR (status = 'pending' AND paid_at IS NULL AND cancelled_at IS NULL)
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.financial_transactions'::regclass
      AND conname = 'financial_transactions_source_pair_check'
  ) THEN
    ALTER TABLE public.financial_transactions
      ADD CONSTRAINT financial_transactions_source_pair_check CHECK (
        (source_type IS NULL AND source_id IS NULL)
        OR (source_type IS NOT NULL AND source_id IS NOT NULL)
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.financial_transactions'::regclass
      AND conname = 'financial_transactions_championship_org_fkey'
  ) THEN
    ALTER TABLE public.financial_transactions
      ADD CONSTRAINT financial_transactions_championship_org_fkey
      FOREIGN KEY (championship_id, organization_id)
      REFERENCES public.championships(id, organization_id) ON DELETE RESTRICT;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS financial_transactions_source_unique
  ON public.financial_transactions (organization_id, championship_id, source_type, source_id)
  WHERE source_type IS NOT NULL AND source_id IS NOT NULL AND status <> 'cancelled';
CREATE INDEX IF NOT EXISTS financial_transactions_championship_dates_idx
  ON public.financial_transactions (championship_id, competence_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS financial_transactions_championship_status_due_idx
  ON public.financial_transactions (championship_id, status, due_date)
  WHERE status <> 'cancelled';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.financial_transactions'::regclass
      AND conname = 'financial_transactions_id_organization_key'
  ) THEN
    ALTER TABLE public.financial_transactions
      ADD CONSTRAINT financial_transactions_id_organization_key
      UNIQUE (id, organization_id);
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.financial_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  championship_id uuid NOT NULL REFERENCES public.championships(id) ON DELETE RESTRICT,
  transaction_id uuid NOT NULL REFERENCES public.financial_transactions(id) ON DELETE RESTRICT,
  object_path text NOT NULL UNIQUE,
  file_name text NOT NULL,
  mime_type text NOT NULL CHECK (
    mime_type IN ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')
  ),
  size_bytes bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT financial_attachments_transaction_org_fkey
    FOREIGN KEY (transaction_id, organization_id)
    REFERENCES public.financial_transactions(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT financial_attachments_championship_org_fkey
    FOREIGN KEY (championship_id, organization_id)
    REFERENCES public.championships(id, organization_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS financial_attachments_transaction_idx
  ON public.financial_attachments (transaction_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.tg_sync_financial_legacy_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.competence_date := COALESCE(NEW.competence_date, NEW.occurred_on, current_date);
    NEW.occurred_on := NEW.competence_date;
    NEW.due_date := COALESCE(NEW.due_date, NEW.due_on);
    NEW.due_on := NEW.due_date;
    IF NEW.status = 'paid' THEN
      NEW.paid_at := COALESCE(NEW.paid_at, NEW.paid_on::timestamptz, now());
      NEW.paid_on := NEW.paid_at::date;
    ELSE
      NEW.paid_at := NULL;
      NEW.paid_on := NULL;
    END IF;
    IF NEW.status = 'cancelled' THEN
      NEW.cancelled_at := COALESCE(NEW.cancelled_at, now());
      NEW.cancellation_reason := COALESCE(
        NULLIF(btrim(NEW.cancellation_reason), ''),
        'Cancelado pelo contrato financeiro legado'
      );
    ELSE
      NEW.cancelled_at := NULL;
      NEW.cancelled_by := NULL;
      NEW.cancellation_reason := NULL;
    END IF;
  ELSE
    IF NEW.competence_date IS DISTINCT FROM OLD.competence_date THEN
      NEW.occurred_on := NEW.competence_date;
    ELSIF NEW.occurred_on IS DISTINCT FROM OLD.occurred_on THEN
      NEW.competence_date := NEW.occurred_on;
    END IF;

    IF NEW.due_date IS DISTINCT FROM OLD.due_date THEN
      NEW.due_on := NEW.due_date;
    ELSIF NEW.due_on IS DISTINCT FROM OLD.due_on THEN
      NEW.due_date := NEW.due_on;
    END IF;

    IF NEW.status = 'paid' THEN
      IF NEW.paid_at IS DISTINCT FROM OLD.paid_at THEN
        NEW.paid_on := NEW.paid_at::date;
      ELSIF NEW.paid_on IS DISTINCT FROM OLD.paid_on THEN
        NEW.paid_at := NEW.paid_on::timestamptz;
      ELSE
        NEW.paid_at := COALESCE(NEW.paid_at, now());
        NEW.paid_on := NEW.paid_at::date;
      END IF;
    ELSE
      NEW.paid_at := NULL;
      NEW.paid_on := NULL;
    END IF;
    IF NEW.status = 'cancelled' THEN
      NEW.cancelled_at := COALESCE(NEW.cancelled_at, now());
      NEW.cancellation_reason := COALESCE(
        NULLIF(btrim(NEW.cancellation_reason), ''),
        'Cancelado pelo contrato financeiro legado'
      );
    ELSE
      NEW.cancelled_at := NULL;
      NEW.cancelled_by := NULL;
      NEW.cancellation_reason := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.tg_sync_financial_legacy_columns()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS financial_transactions_compat_sync ON public.financial_transactions;
CREATE TRIGGER financial_transactions_compat_sync
  BEFORE INSERT OR UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.tg_sync_financial_legacy_columns();

DROP TRIGGER IF EXISTS financial_transactions_updated_at ON public.financial_transactions;
CREATE TRIGGER financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS financial_transactions_admin_audit ON public.financial_transactions;
CREATE TRIGGER financial_transactions_admin_audit
  BEFORE INSERT OR UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_admin_audit_fields();

CREATE OR REPLACE FUNCTION public.can_manage_finance(p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND public.is_org_member(p_organization_id)
    AND (
      public.current_user_has_role(p_organization_id, 'owner'::public.app_role)
      OR public.current_user_has_role(p_organization_id, 'admin'::public.app_role)
    );
$$;

REVOKE ALL ON FUNCTION public.can_manage_finance(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_finance(uuid) TO authenticated;

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS financial_transactions_admin_select ON public.financial_transactions;
CREATE POLICY financial_transactions_admin_select ON public.financial_transactions
  FOR SELECT TO authenticated USING (public.can_manage_finance(organization_id));

DROP POLICY IF EXISTS financial_attachments_admin_select ON public.financial_attachments;
CREATE POLICY financial_attachments_admin_select ON public.financial_attachments
  FOR SELECT TO authenticated USING (public.can_manage_finance(organization_id));

REVOKE ALL ON public.financial_transactions FROM anon, authenticated;
REVOKE ALL ON public.financial_attachments FROM anon, authenticated;
GRANT SELECT ON public.financial_transactions, public.financial_attachments TO authenticated;
GRANT ALL ON public.financial_transactions, public.financial_attachments TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'financial-attachments',
  'financial-attachments',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS financial_attachments_storage_admin_read ON storage.objects;
CREATE POLICY financial_attachments_storage_admin_read ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'financial-attachments'
    AND EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id::text = (storage.foldername(name))[1]
        AND public.can_manage_finance(o.id)
    )
  );

DROP POLICY IF EXISTS financial_attachments_storage_admin_insert ON storage.objects;
CREATE POLICY financial_attachments_storage_admin_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'financial-attachments'
    AND EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id::text = (storage.foldername(name))[1]
        AND public.can_manage_finance(o.id)
    )
  );

DROP POLICY IF EXISTS financial_attachments_storage_admin_delete ON storage.objects;
CREATE POLICY financial_attachments_storage_admin_delete ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'financial-attachments'
    AND EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id::text = (storage.foldername(name))[1]
        AND public.can_manage_finance(o.id)
    )
  );

CREATE OR REPLACE FUNCTION public.phase5_finance_context(p_championship_id uuid)
RETURNS public.championships
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.championships%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'finance:authentication_required';
  END IF;

  SELECT * INTO target
  FROM public.championships
  WHERE id = p_championship_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'finance:championship_not_found';
  END IF;
  IF NOT public.can_manage_finance(target.organization_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'finance:forbidden';
  END IF;
  RETURN target;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_championship_finance(
  p_championship_id uuid,
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_transaction_type text DEFAULT NULL,
  p_category text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.championships%ROWTYPE;
  result jsonb;
BEGIN
  target := public.phase5_finance_context(p_championship_id);

  IF p_date_from IS NOT NULL AND p_date_to IS NOT NULL AND p_date_from > p_date_to THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'finance:invalid_period';
  END IF;
  IF p_status IS NOT NULL AND p_status NOT IN ('pending', 'paid', 'cancelled', 'overdue') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'finance:invalid_status';
  END IF;
  IF p_transaction_type IS NOT NULL AND p_transaction_type NOT IN ('income', 'expense') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'finance:invalid_type';
  END IF;

  WITH filtered AS (
    SELECT transaction.*
    FROM public.financial_transactions transaction
    WHERE transaction.championship_id = p_championship_id
      AND transaction.organization_id = target.organization_id
      AND (p_date_from IS NULL OR transaction.competence_date >= p_date_from)
      AND (p_date_to IS NULL OR transaction.competence_date <= p_date_to)
      AND (
        p_status IS NULL
        OR (p_status = 'overdue' AND transaction.status = 'pending'
            AND transaction.due_date IS NOT NULL AND transaction.due_date < current_date)
        OR (p_status <> 'overdue' AND transaction.status = p_status)
      )
      AND (p_transaction_type IS NULL OR transaction.transaction_type = p_transaction_type)
      AND (p_category IS NULL OR lower(transaction.category) = lower(p_category))
  ),
  totals AS (
    SELECT
      COALESCE(sum(amount) FILTER (
        WHERE transaction_type = 'income' AND status = 'paid'
      ), 0) AS realized_income,
      COALESCE(sum(amount) FILTER (
        WHERE transaction_type = 'expense' AND status = 'paid'
      ), 0) AS realized_expense,
      COALESCE(sum(amount) FILTER (
        WHERE transaction_type = 'income' AND status IN ('pending', 'paid')
      ), 0) AS projected_income,
      COALESCE(sum(amount) FILTER (
        WHERE transaction_type = 'expense' AND status IN ('pending', 'paid')
      ), 0) AS projected_expense,
      count(*) FILTER (
        WHERE status = 'pending' AND due_date IS NOT NULL AND due_date < current_date
      ) AS overdue_count
    FROM filtered
  )
  SELECT jsonb_build_object(
    'summary', jsonb_build_object(
      'realized_income', totals.realized_income,
      'realized_expense', totals.realized_expense,
      'realized_balance', totals.realized_income - totals.realized_expense,
      'projected_income', totals.projected_income,
      'projected_expense', totals.projected_expense,
      'projected_balance', totals.projected_income - totals.projected_expense,
      'overdue_count', totals.overdue_count
    ),
    'transactions', COALESCE((
      SELECT jsonb_agg(
        to_jsonb(item) || jsonb_build_object(
          'attachments',
          COALESCE((
            SELECT jsonb_agg(to_jsonb(attachment) ORDER BY attachment.created_at DESC)
            FROM public.financial_attachments attachment
            WHERE attachment.transaction_id = item.id
          ), '[]'::jsonb)
        )
        ORDER BY item.competence_date DESC, item.created_at DESC
      )
      FROM filtered item
    ), '[]'::jsonb),
    'categories', COALESCE((
      SELECT jsonb_agg(category ORDER BY category)
      FROM (
        SELECT DISTINCT transaction.category
        FROM public.financial_transactions transaction
        WHERE transaction.championship_id = p_championship_id
          AND transaction.organization_id = target.organization_id
      ) categories
    ), '[]'::jsonb)
  )
  INTO result
  FROM totals;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_financial_transaction(
  p_championship_id uuid,
  p_transaction_id uuid,
  p_payload jsonb
)
RETURNS public.financial_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.championships%ROWTYPE;
  current_record public.financial_transactions%ROWTYPE;
  result public.financial_transactions%ROWTYPE;
  transaction_kind text := p_payload->>'transaction_type';
  category_value text := btrim(COALESCE(p_payload->>'category', ''));
  description_value text := btrim(COALESCE(p_payload->>'description', ''));
  amount_value numeric;
  competence_value date;
  due_value date;
BEGIN
  target := public.phase5_finance_context(p_championship_id);

  BEGIN
    amount_value := (p_payload->>'amount')::numeric;
    competence_value := (p_payload->>'competence_date')::date;
    due_value := NULLIF(p_payload->>'due_date', '')::date;
  EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range OR datetime_field_overflow THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'finance:invalid_payload';
  END;

  IF transaction_kind NOT IN ('income', 'expense')
     OR char_length(category_value) NOT BETWEEN 2 AND 80
     OR char_length(description_value) NOT BETWEEN 3 AND 240
     OR amount_value IS NULL OR amount_value <= 0 OR amount_value > 999999999999.99
     OR competence_value IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'finance:invalid_payload';
  END IF;

  IF p_transaction_id IS NULL THEN
    INSERT INTO public.financial_transactions (
      organization_id, championship_id, transaction_type, category, description,
      competence_date, due_date, amount, status, counterparty, notes,
      source_type, source_id, created_by, updated_by
    )
    VALUES (
      target.organization_id, p_championship_id, transaction_kind, category_value,
      description_value, competence_value, due_value, amount_value, 'pending',
      NULLIF(btrim(p_payload->>'counterparty'), ''),
      NULLIF(btrim(p_payload->>'notes'), ''),
      NULLIF(btrim(p_payload->>'source_type'), ''),
      NULLIF(p_payload->>'source_id', '')::uuid,
      auth.uid(), auth.uid()
    )
    RETURNING * INTO result;
  ELSE
    SELECT * INTO current_record
    FROM public.financial_transactions
    WHERE id = p_transaction_id
      AND championship_id = p_championship_id
      AND organization_id = target.organization_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'finance:transaction_not_found';
    END IF;
    IF current_record.status <> 'pending' THEN
      RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'finance:transaction_locked';
    END IF;

    UPDATE public.financial_transactions SET
      transaction_type = transaction_kind,
      category = category_value,
      description = description_value,
      competence_date = competence_value,
      due_date = due_value,
      amount = amount_value,
      counterparty = NULLIF(btrim(p_payload->>'counterparty'), ''),
      notes = NULLIF(btrim(p_payload->>'notes'), ''),
      updated_by = auth.uid(),
      updated_at = now()
    WHERE id = current_record.id
    RETURNING * INTO result;
  END IF;

  INSERT INTO public.audit_logs (
    organization_id, user_id, entity_type, entity_id, action, old_data, new_data, context
  )
  VALUES (
    target.organization_id, auth.uid(), 'financial_transaction', result.id,
    CASE WHEN p_transaction_id IS NULL THEN 'created' ELSE 'updated' END,
    CASE WHEN p_transaction_id IS NULL THEN NULL ELSE to_jsonb(current_record) END,
    to_jsonb(result), jsonb_build_object('championship_id', p_championship_id)
  );

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_financial_transaction(
  p_championship_id uuid,
  p_transaction_id uuid,
  p_paid_at timestamptz DEFAULT now()
)
RETURNS public.financial_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.championships%ROWTYPE;
  previous public.financial_transactions%ROWTYPE;
  result public.financial_transactions%ROWTYPE;
BEGIN
  target := public.phase5_finance_context(p_championship_id);
  SELECT * INTO previous
  FROM public.financial_transactions
  WHERE id = p_transaction_id AND championship_id = p_championship_id
    AND organization_id = target.organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'finance:transaction_not_found';
  END IF;
  IF previous.status <> 'pending' OR p_paid_at IS NULL OR p_paid_at > now() + interval '1 day' THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'finance:invalid_settlement';
  END IF;

  UPDATE public.financial_transactions
  SET status = 'paid', paid_at = p_paid_at, updated_by = auth.uid(), updated_at = now()
  WHERE id = previous.id
  RETURNING * INTO result;

  INSERT INTO public.audit_logs (
    organization_id, user_id, entity_type, entity_id, action, old_data, new_data, context
  ) VALUES (
    target.organization_id, auth.uid(), 'financial_transaction', result.id, 'settled',
    to_jsonb(previous), to_jsonb(result), jsonb_build_object('championship_id', p_championship_id)
  );
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.reverse_financial_settlement(
  p_championship_id uuid,
  p_transaction_id uuid,
  p_reason text
)
RETURNS public.financial_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.championships%ROWTYPE;
  previous public.financial_transactions%ROWTYPE;
  result public.financial_transactions%ROWTYPE;
BEGIN
  target := public.phase5_finance_context(p_championship_id);
  IF char_length(btrim(COALESCE(p_reason, ''))) < 10 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'finance:reversal_reason_required';
  END IF;

  SELECT * INTO previous
  FROM public.financial_transactions
  WHERE id = p_transaction_id AND championship_id = p_championship_id
    AND organization_id = target.organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'finance:transaction_not_found';
  END IF;
  IF previous.status <> 'paid' THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'finance:transaction_not_paid';
  END IF;

  UPDATE public.financial_transactions
  SET status = 'pending', paid_at = NULL, updated_by = auth.uid(), updated_at = now()
  WHERE id = previous.id
  RETURNING * INTO result;

  INSERT INTO public.audit_logs (
    organization_id, user_id, entity_type, entity_id, action, old_data, new_data, context
  ) VALUES (
    target.organization_id, auth.uid(), 'financial_transaction', result.id,
    'settlement_reversed', to_jsonb(previous), to_jsonb(result),
    jsonb_build_object('championship_id', p_championship_id, 'reason', btrim(p_reason))
  );
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_financial_transaction(
  p_championship_id uuid,
  p_transaction_id uuid,
  p_reason text
)
RETURNS public.financial_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.championships%ROWTYPE;
  previous public.financial_transactions%ROWTYPE;
  result public.financial_transactions%ROWTYPE;
BEGIN
  target := public.phase5_finance_context(p_championship_id);
  IF char_length(btrim(COALESCE(p_reason, ''))) < 10 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'finance:cancellation_reason_required';
  END IF;

  SELECT * INTO previous
  FROM public.financial_transactions
  WHERE id = p_transaction_id AND championship_id = p_championship_id
    AND organization_id = target.organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'finance:transaction_not_found';
  END IF;
  IF previous.status <> 'pending' THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'finance:transaction_locked';
  END IF;

  UPDATE public.financial_transactions SET
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by = auth.uid(),
    cancellation_reason = btrim(p_reason),
    updated_by = auth.uid(),
    updated_at = now()
  WHERE id = previous.id
  RETURNING * INTO result;

  INSERT INTO public.audit_logs (
    organization_id, user_id, entity_type, entity_id, action, old_data, new_data, context
  ) VALUES (
    target.organization_id, auth.uid(), 'financial_transaction', result.id, 'cancelled',
    to_jsonb(previous), to_jsonb(result), jsonb_build_object('championship_id', p_championship_id)
  );
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.register_financial_attachment(
  p_championship_id uuid,
  p_transaction_id uuid,
  p_object_path text,
  p_file_name text,
  p_mime_type text,
  p_size_bytes bigint
)
RETURNS public.financial_attachments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, storage
AS $$
DECLARE
  target public.championships%ROWTYPE;
  transaction_record public.financial_transactions%ROWTYPE;
  result public.financial_attachments%ROWTYPE;
BEGIN
  target := public.phase5_finance_context(p_championship_id);
  SELECT * INTO transaction_record
  FROM public.financial_transactions
  WHERE id = p_transaction_id AND championship_id = p_championship_id
    AND organization_id = target.organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'finance:transaction_not_found';
  END IF;
  IF p_size_bytes <= 0 OR p_size_bytes > 10485760
     OR p_mime_type NOT IN ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')
     OR p_object_path NOT LIKE (
       target.organization_id::text || '/' || p_championship_id::text || '/'
       || p_transaction_id::text || '/%'
     )
     OR NOT EXISTS (
       SELECT 1 FROM storage.objects object
       WHERE object.bucket_id = 'financial-attachments' AND object.name = p_object_path
     ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'finance:invalid_attachment';
  END IF;

  INSERT INTO public.financial_attachments (
    organization_id, championship_id, transaction_id, object_path,
    file_name, mime_type, size_bytes, created_by
  ) VALUES (
    target.organization_id, p_championship_id, p_transaction_id, p_object_path,
    btrim(p_file_name), p_mime_type, p_size_bytes, auth.uid()
  )
  RETURNING * INTO result;

  INSERT INTO public.audit_logs (
    organization_id, user_id, entity_type, entity_id, action, new_data, context
  ) VALUES (
    target.organization_id, auth.uid(), 'financial_attachment', result.id, 'created',
    to_jsonb(result), jsonb_build_object(
      'championship_id', p_championship_id, 'transaction_id', p_transaction_id
    )
  );
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_financial_attachment(
  p_championship_id uuid,
  p_attachment_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, storage
AS $$
DECLARE
  target public.championships%ROWTYPE;
  attachment public.financial_attachments%ROWTYPE;
BEGIN
  target := public.phase5_finance_context(p_championship_id);
  SELECT * INTO attachment
  FROM public.financial_attachments
  WHERE id = p_attachment_id AND championship_id = p_championship_id
    AND organization_id = target.organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'finance:attachment_not_found';
  END IF;

  DELETE FROM storage.objects
  WHERE bucket_id = 'financial-attachments' AND name = attachment.object_path;
  DELETE FROM public.financial_attachments WHERE id = attachment.id;

  INSERT INTO public.audit_logs (
    organization_id, user_id, entity_type, entity_id, action, old_data, context
  ) VALUES (
    target.organization_id, auth.uid(), 'financial_attachment', attachment.id, 'removed',
    to_jsonb(attachment), jsonb_build_object(
      'championship_id', p_championship_id, 'transaction_id', attachment.transaction_id
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.phase5_finance_context(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_championship_finance(uuid,date,date,text,text,text)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_financial_transaction(uuid,uuid,jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.settle_financial_transaction(uuid,uuid,timestamptz)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reverse_financial_settlement(uuid,uuid,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_financial_transaction(uuid,uuid,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.register_financial_attachment(uuid,uuid,text,text,text,bigint)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_financial_attachment(uuid,uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_championship_finance(uuid,date,date,text,text,text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_financial_transaction(uuid,uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.settle_financial_transaction(uuid,uuid,timestamptz)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.reverse_financial_settlement(uuid,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_financial_transaction(uuid,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_financial_attachment(uuid,uuid,text,text,text,bigint)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_financial_attachment(uuid,uuid) TO authenticated;
