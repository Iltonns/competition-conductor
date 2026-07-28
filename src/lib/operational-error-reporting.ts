import { supabase } from "@/integrations/supabase/client";

const recentlyReported = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 60_000;

export function reportOperationalClientError(error: unknown) {
  if (typeof window === "undefined") return;

  const code = getErrorCode(error);
  const fingerprint = hashError(error);
  const route = window.location.pathname.slice(0, 200) || "/";
  const deduplicationKey = `${fingerprint}:${route}`;
  const lastReportedAt = recentlyReported.get(deduplicationKey) ?? 0;

  if (Date.now() - lastReportedAt < DEDUPLICATION_WINDOW_MS) return;
  recentlyReported.set(deduplicationKey, Date.now());
  pruneReportedErrors();

  try {
    void supabase
      .rpc(
        "record_my_client_error" as never,
        {
          p_code: code,
          p_fingerprint: fingerprint,
          p_route: route,
        } as never,
      )
      .then(
        () => undefined,
        () => undefined,
      );
  } catch {
    // Telemetry must never create a secondary application failure.
  }
}

function getErrorCode(error: unknown) {
  const rawCode =
    error instanceof Error && error.name
      ? error.name
      : typeof error === "string"
        ? "Error"
        : "UnknownError";
  const normalized = rawCode.replace(/[^A-Za-z0-9_.:-]/g, "").slice(0, 100);
  return /^[A-Za-z]/.test(normalized) && normalized.length >= 2 ? normalized : "UnknownError";
}

function hashError(error: unknown) {
  const value =
    error instanceof Error
      ? `${error.name}:${error.message}`
      : typeof error === "string"
        ? error
        : Object.prototype.toString.call(error);
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function pruneReportedErrors() {
  const threshold = Date.now() - DEDUPLICATION_WINDOW_MS;
  for (const [key, reportedAt] of recentlyReported) {
    if (reportedAt < threshold) recentlyReported.delete(key);
  }
}
