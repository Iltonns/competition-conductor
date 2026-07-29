import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const checkoutInputSchema = z.object({
  organizationId: z.string().uuid(),
  planVersionId: z.string().uuid(),
  clientRequestId: z.string().uuid(),
});

const preparedCheckoutSchema = z.object({
  id: z.string().uuid(),
  order_nsu: z.string().uuid(),
  amount_cents: z.number().int().positive(),
  currency: z.literal("BRL"),
  description: z.string(),
  checkout_url: z.string().url().nullable(),
  status: z.enum(["pending", "checkout_created"]),
});

const infinitePayLinkSchema = z.object({
  url: z.string().url().startsWith("https://checkout.infinitepay.com.br/"),
});

type BillingRpc = (
  name: "prepare_subscription_checkout" | "attach_subscription_checkout_url",
  args: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

function requiredServerUrl(name: "APP_BASE_URL") {
  const value = process.env[name];
  if (!value) throw new Error(`billing:missing_${name.toLowerCase()}`);
  const url = new URL(value);
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error("billing:invalid_app_base_url");
  }
  return url.origin;
}

function infinitePayHandle() {
  const handle = process.env.INFINITEPAY_HANDLE?.trim();
  if (!handle || !/^[a-zA-Z0-9_-]{3,80}$/.test(handle)) {
    throw new Error("billing:invalid_infinitepay_handle");
  }
  return handle;
}

function checkoutErrorCode(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const knownCode = message.match(/(?:billing|subscription):[a-z0-9_]+/i)?.[0];
  return knownCode
    ? knownCode.toLowerCase().replace(":", ".")
    : "billing.checkout.unexpected_failure";
}

export const createInfinitePayCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(checkoutInputSchema)
  .handler(async ({ data, context }) => {
    const startedAt = Date.now();
    let failureKind: "server_error" | "rpc_failure" = "rpc_failure";
    try {
      const rpc = context.supabase.rpc as unknown as BillingRpc;
      const { data: preparedData, error: prepareError } = await rpc(
        "prepare_subscription_checkout",
        {
          p_organization_id: data.organizationId,
          p_plan_version_id: data.planVersionId,
          p_client_request_id: data.clientRequestId,
        },
      );
      if (prepareError) throw new Error(prepareError.message);

      const prepared = preparedCheckoutSchema.parse(preparedData);
      if (prepared.checkout_url) return { url: prepared.checkout_url };

      failureKind = "server_error";
      const appOrigin = requiredServerUrl("APP_BASE_URL");
      const response = await fetch("https://api.checkout.infinitepay.io/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: infinitePayHandle(),
          redirect_url: `${appOrigin}/settings/subscription?checkout=return`,
          webhook_url: `${appOrigin}/api/billing/infinitepay/webhook`,
          order_nsu: prepared.order_nsu,
          items: [
            {
              quantity: 1,
              price: prepared.amount_cents,
              description: prepared.description,
            },
          ],
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error("billing:provider_checkout_failed");

      const link = infinitePayLinkSchema.parse(await response.json());
      failureKind = "rpc_failure";
      const { error: attachError } = await rpc("attach_subscription_checkout_url", {
        p_order_id: prepared.id,
        p_checkout_url: link.url,
      });
      if (attachError) throw new Error(attachError.message);
      return { url: link.url };
    } catch (error) {
      try {
        const { recordServiceOperationalEvent } =
          await import("@/features/observability/api/operational-events.server");
        await recordServiceOperationalEvent({
          eventKind: failureKind,
          source: failureKind === "rpc_failure" ? "rpc" : "server",
          severity: "error",
          code: checkoutErrorCode(error),
          route: "/settings/subscription",
          durationMs: Date.now() - startedAt,
        });
      } catch {
        // A telemetria nao pode substituir a falha original do checkout.
        console.warn("Operational event module could not be loaded.");
      }
      throw error;
    }
  });
