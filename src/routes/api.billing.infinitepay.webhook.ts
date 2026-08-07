import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const webhookSchema = z.object({
  invoice_slug: z.string().min(1).max(200),
  amount: z.number().int().positive(),
  transaction_nsu: z.string().min(1).max(200),
  order_nsu: z.string().uuid(),
  receipt_url: z.string().url().startsWith("https://"),
});

const paymentCheckSchema = z.object({
  success: z.literal(true),
  paid: z.literal(true),
  amount: z.number().int().positive(),
});

const confirmPaymentSchema = z.object({
  processed: z.boolean(),
  duplicate: z.boolean(),
  error: z.string().optional(),
});

function json(payload: unknown, status = 200) {
  return Response.json(payload, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

const webhookRoute = "/api/billing/infinitepay/webhook";

async function webhookResponse(
  startedAt: number,
  code: string,
  status: number,
  success: boolean,
  severity: "info" | "warning" | "error" | "critical",
) {
  try {
    const { recordServiceOperationalEvent } =
      await import("@/features/observability/api/operational-events.server");
    await recordServiceOperationalEvent({
      eventKind: success ? "webhook_event" : "webhook_failure",
      source: "webhook",
      severity,
      code,
      route: webhookRoute,
      durationMs: Date.now() - startedAt,
    });
  } catch {
    // O registro de telemetria nao pode alterar a resposta do webhook.
    console.warn("Operational event module could not be loaded.");
  }
  const publicMessage =
    code === "billing.webhook.payload_too_large" ||
    code === "billing.webhook.unexpected_failure" ||
    code === "billing.webhook.provider_response_invalid"
      ? "invalid_payload"
      : code.replace("billing.webhook.", "");
  return json({ success, message: success ? null : publicMessage }, status);
}

export const Route = createFileRoute("/api/billing/infinitepay/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const startedAt = Date.now();
        let unexpectedCode = "billing.webhook.invalid_payload";
        try {
          if (Number(request.headers.get("content-length") ?? 0) > 32_768) {
            return webhookResponse(
              startedAt,
              "billing.webhook.payload_too_large",
              413,
              false,
              "warning",
            );
          }
          const rawPayload = await request.text();
          if (new TextEncoder().encode(rawPayload).byteLength > 32_768) {
            return webhookResponse(
              startedAt,
              "billing.webhook.payload_too_large",
              413,
              false,
              "warning",
            );
          }
          const payload = webhookSchema.parse(JSON.parse(rawPayload));
          unexpectedCode = "billing.webhook.unexpected_failure";
          const handle = process.env.INFINITEPAY_HANDLE?.trim();
          if (!handle || !/^[a-zA-Z0-9_-]{3,80}$/.test(handle)) {
            return webhookResponse(
              startedAt,
              "billing.webhook.provider_not_configured",
              503,
              false,
              "critical",
            );
          }

          // A InfinitePay nao documenta assinatura criptografica do webhook.
          // Autenticamos o evento consultando o pagamento diretamente no provedor.
          const verificationResponse = await fetch(
            "https://api.checkout.infinitepay.io/payment_check",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                handle,
                order_nsu: payload.order_nsu,
                transaction_nsu: payload.transaction_nsu,
                slug: payload.invoice_slug,
              }),
              signal: AbortSignal.timeout(10_000),
            },
          );
          if (!verificationResponse.ok) {
            return webhookResponse(
              startedAt,
              "billing.webhook.verification_failed",
              verificationResponse.status >= 500 ? 502 : 400,
              false,
              "warning",
            );
          }
          unexpectedCode = "billing.webhook.provider_response_invalid";
          const verified = paymentCheckSchema.parse(await verificationResponse.json());
          if (verified.amount !== payload.amount) {
            return webhookResponse(
              startedAt,
              "billing.webhook.amount_mismatch",
              400,
              false,
              "error",
            );
          }

          unexpectedCode = "billing.webhook.processing_failed";
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin.rpc(
            "confirm_infinitepay_subscription_payment",
            {
              p_event_key: payload.transaction_nsu,
              p_order_nsu: payload.order_nsu,
              p_transaction_nsu: payload.transaction_nsu,
              p_invoice_slug: payload.invoice_slug,
              p_amount_cents: verified.amount,
              p_receipt_url: payload.receipt_url,
            },
          );
          if (error) {
            return webhookResponse(
              startedAt,
              "billing.webhook.processing_failed",
              500,
              false,
              "error",
            );
          }
          const confirmation = confirmPaymentSchema.parse(data);
          if (!confirmation.processed && !confirmation.duplicate) {
            return webhookResponse(
              startedAt,
              "billing.webhook.processing_rejected",
              400,
              false,
              "error",
            );
          }
          return webhookResponse(
            startedAt,
            confirmation.duplicate
              ? "billing.webhook.duplicate"
              : "billing.webhook.payment_confirmed",
            200,
            true,
            "info",
          );
        } catch {
          console.error("InfinitePay webhook rejected.");
          const status =
            unexpectedCode === "billing.webhook.invalid_payload"
              ? 400
              : unexpectedCode === "billing.webhook.provider_response_invalid"
                ? 502
                : 500;
          return webhookResponse(startedAt, unexpectedCode, status, false, "error");
        }
      },
    },
  },
});
