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

type ConfirmPaymentRpc = (
  name: "confirm_infinitepay_subscription_payment",
  args: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

function json(payload: unknown, status = 200) {
  return Response.json(payload, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export const Route = createFileRoute("/api/billing/infinitepay/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (Number(request.headers.get("content-length") ?? 0) > 32_768) {
            return json({ success: false, message: "invalid_payload" }, 413);
          }
          const rawPayload = await request.text();
          if (new TextEncoder().encode(rawPayload).byteLength > 32_768) {
            return json({ success: false, message: "invalid_payload" }, 413);
          }
          const payload = webhookSchema.parse(JSON.parse(rawPayload));
          const handle = process.env.INFINITEPAY_HANDLE?.trim();
          if (!handle || !/^[a-zA-Z0-9_-]{3,80}$/.test(handle)) {
            return json({ success: false, message: "provider_not_configured" }, 503);
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
            return json({ success: false, message: "verification_failed" }, 400);
          }
          const verified = paymentCheckSchema.parse(await verificationResponse.json());
          if (verified.amount !== payload.amount) {
            return json({ success: false, message: "amount_mismatch" }, 400);
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const rpc = supabaseAdmin.rpc as unknown as ConfirmPaymentRpc;
          const { data, error } = await rpc("confirm_infinitepay_subscription_payment", {
            p_event_key: payload.transaction_nsu,
            p_order_nsu: payload.order_nsu,
            p_transaction_nsu: payload.transaction_nsu,
            p_invoice_slug: payload.invoice_slug,
            p_amount_cents: verified.amount,
            p_receipt_url: payload.receipt_url,
          });
          if (error) return json({ success: false, message: "processing_failed" }, 400);
          const confirmation = confirmPaymentSchema.parse(data);
          if (!confirmation.processed && !confirmation.duplicate) {
            return json({ success: false, message: "processing_rejected" }, 400);
          }
          return json({ success: true, message: null });
        } catch (error) {
          console.error("InfinitePay webhook rejected:", error);
          return json({ success: false, message: "invalid_payload" }, 400);
        }
      },
    },
  },
});
