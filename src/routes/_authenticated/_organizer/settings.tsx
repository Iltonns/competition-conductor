import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { BellRing, Building2, CreditCard, Globe2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_organizer/settings")({
  head: () => ({ meta: [{ title: "Configurações · IS Arena" }] }),
  component: SettingsLayout,
});

function SettingsLayout() {
  const navigation = [
    { to: "/settings/organization", label: "Organização", icon: Building2 },
    { to: "/settings/users", label: "Usuários e acessos", icon: Users },
    { to: "/settings/notifications", label: "Notificações", icon: BellRing },
    { to: "/settings/subscription", label: "Assinatura e limites", icon: CreditCard },
    { to: "/settings/public-page", label: "Página pública", icon: Globe2 },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administre os dados da organização, membros, funções e convites.
        </p>
      </div>
      <nav className="flex gap-2 border-b" aria-label="Configurações">
        {navigation.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "inline-flex items-center gap-2 border-b-2 border-transparent px-3 py-3 text-sm font-medium text-muted-foreground",
            )}
            activeProps={{ className: "border-primary text-foreground" }}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
