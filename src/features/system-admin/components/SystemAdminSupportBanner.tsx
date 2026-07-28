import { Link } from "@tanstack/react-router";
import { Clock3, LifeBuoy } from "lucide-react";
import { useActiveSupportSession } from "../hooks/useSystemAdmin";

export function SystemAdminSupportBanner() {
  const support = useActiveSupportSession();
  if (!support.data) return null;

  return (
    <div className="sticky top-14 z-20 border-b border-amber-300/30 bg-amber-300 px-[var(--content-padding-x)] py-2 text-amber-950">
      <div className="mx-auto flex max-w-[var(--layout-max-width)] flex-wrap items-center justify-between gap-2 text-xs font-semibold">
        <span className="flex items-center gap-2">
          <LifeBuoy className="h-4 w-4" />
          Modo suporte somente leitura: {support.data.organization_name}
        </span>
        <Link
          to="/system-admin/suporte"
          className="inline-flex items-center gap-1 underline underline-offset-2"
        >
          <Clock3 className="h-3.5 w-3.5" />
          encerra às {new Date(support.data.expires_at).toLocaleTimeString("pt-BR")}
        </Link>
      </div>
    </div>
  );
}
