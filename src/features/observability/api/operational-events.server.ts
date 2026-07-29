import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type ServiceOperationalEvent = {
  eventKind: "server_error" | "rpc_failure" | "webhook_event" | "webhook_failure";
  source: "server" | "rpc" | "webhook";
  severity: "info" | "warning" | "error" | "critical";
  code: string;
  route: string;
  durationMs: number;
  fingerprint?: string | null;
};

type ServiceOperationalEventRpc = (
  name: "record_service_operational_event",
  args: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

export async function recordServiceOperationalEvent(event: ServiceOperationalEvent) {
  try {
    const rpc = supabaseAdmin.rpc as unknown as ServiceOperationalEventRpc;
    const { error } = await rpc("record_service_operational_event", {
      p_event_kind: event.eventKind,
      p_source: event.source,
      p_severity: event.severity,
      p_code: event.code,
      p_route: event.route,
      p_duration_ms: Math.min(Math.max(Math.round(event.durationMs), 0), 600_000),
      p_fingerprint: event.fingerprint ?? null,
    });
    if (error) throw new Error(error.message);
  } catch {
    // Telemetria nunca pode derrubar o fluxo observado nem expor seu payload.
    console.warn("Operational event could not be recorded.");
  }
}
