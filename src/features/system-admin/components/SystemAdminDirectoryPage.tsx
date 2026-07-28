import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSystemAdminDirectory } from "../hooks/useSystemAdmin";
import type {
  SystemAdminChampionshipRow,
  SystemAdminDirectoryKind,
  SystemAdminOrganizationRow,
  SystemAdminSubscriptionRow,
  SystemAdminUserRow,
} from "../types/system-admin.types";

const PAGE_SIZE = 25;

const pageTitle: Record<SystemAdminDirectoryKind, string> = {
  organizations: "Organizações e clientes",
  users: "Usuários",
  championships: "Campeonatos e conteúdo",
  subscriptions: "Planos e assinaturas",
};

export function SystemAdminDirectoryPage({ kind }: { kind: SystemAdminDirectoryKind }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const directory = useSystemAdminDirectory(kind, search, page, PAGE_SIZE);

  useEffect(() => setPage(0), [kind, search]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-black">{pageTitle[kind]}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Consulta administrativa paginada e restrita ao papel de plataforma.
        </p>
      </div>

      <Card className="border-amber-400/10">
        <CardHeader>
          <form
            className="flex max-w-xl gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(searchInput.trim());
            }}
          >
            <Input
              value={searchInput}
              maxLength={100}
              placeholder="Buscar por nome, e-mail ou identificador"
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <Button type="submit" variant="outline">
              <Search className="mr-2 h-4 w-4" /> Buscar
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {directory.isLoading ? (
            <div className="grid min-h-48 place-items-center">
              <Loader2 className="h-6 w-6 animate-spin text-amber-300" />
            </div>
          ) : directory.isError || !directory.data ? (
            <p className="py-12 text-center text-sm text-destructive">
              A consulta foi negada ou está indisponível.
            </p>
          ) : (
            <>
              <DirectoryTable kind={kind} items={directory.data.items} />
              <div className="mt-4 flex items-center justify-between gap-4 text-xs">
                <span className="text-muted-foreground">{directory.data.total} registro(s)</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 0}
                    onClick={() => setPage((current) => Math.max(current - 1, 0))}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={(page + 1) * PAGE_SIZE >= directory.data.total}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DirectoryTable({
  kind,
  items,
}: {
  kind: SystemAdminDirectoryKind;
  items: Array<
    | SystemAdminOrganizationRow
    | SystemAdminUserRow
    | SystemAdminChampionshipRow
    | SystemAdminSubscriptionRow
  >;
}) {
  if (!items.length) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Nenhum registro.</p>;
  }

  if (kind === "organizations") {
    return <OrganizationsTable items={items as SystemAdminOrganizationRow[]} />;
  }
  if (kind === "users") return <UsersTable items={items as SystemAdminUserRow[]} />;
  if (kind === "championships") {
    return <ChampionshipsTable items={items as SystemAdminChampionshipRow[]} />;
  }
  return <SubscriptionsTable items={items as SystemAdminSubscriptionRow[]} />;
}

function OrganizationsTable({ items }: { items: SystemAdminOrganizationRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Organização</TableHead>
          <TableHead>Plano</TableHead>
          <TableHead>Membros</TableHead>
          <TableHead>Campeonatos</TableHead>
          <TableHead>Criada em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <strong>{item.name}</strong>
              <span className="block text-xs text-muted-foreground">{item.slug || item.id}</span>
            </TableCell>
            <TableCell>
              <Status value={item.subscription_status || "sem assinatura"} />
              <span className="ml-2 text-xs">{item.plan_name || "—"}</span>
            </TableCell>
            <TableCell>{item.members_count}</TableCell>
            <TableCell>{item.championships_count}</TableCell>
            <TableCell>{formatDate(item.created_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function UsersTable({ items }: { items: SystemAdminUserRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usuário</TableHead>
          <TableHead>Organizações</TableHead>
          <TableHead>Papel de plataforma</TableHead>
          <TableHead>Criado em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <strong>{item.display_name || "Sem nome"}</strong>
              <span className="block text-xs text-muted-foreground">{item.email || item.id}</span>
            </TableCell>
            <TableCell>{item.organizations_count}</TableCell>
            <TableCell>{item.is_system_admin ? <Status value="system admin" /> : "—"}</TableCell>
            <TableCell>{formatDate(item.created_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ChampionshipsTable({ items }: { items: SystemAdminChampionshipRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Campeonato</TableHead>
          <TableHead>Organização</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Público</TableHead>
          <TableHead>Criado em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <strong>{item.name}</strong>
              <span className="block text-xs text-muted-foreground">{item.slug}</span>
            </TableCell>
            <TableCell>{item.organization_name}</TableCell>
            <TableCell>
              <Status value={item.status} />
            </TableCell>
            <TableCell>{item.is_public ? "Sim" : "Não"}</TableCell>
            <TableCell>{formatDate(item.created_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SubscriptionsTable({ items }: { items: SystemAdminSubscriptionRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Organização</TableHead>
          <TableHead>Plano</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Gateway</TableHead>
          <TableHead>Atualizada em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <strong>{item.organization_name}</strong>
            </TableCell>
            <TableCell>
              {item.plan_name} · v{item.plan_version}
            </TableCell>
            <TableCell>
              <Status value={item.status} />
            </TableCell>
            <TableCell>{item.provider_connected ? "Conectado" : "Não conectado"}</TableCell>
            <TableCell>{formatDate(item.updated_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Status({ value }: { value: string }) {
  return <Badge variant="secondary">{value.replaceAll("_", " ")}</Badge>;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}
