import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Search,
  Shield,
  Trophy,
  UserRound,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useDirectoryOrganizations,
  useGlobalAthlete,
  useGlobalAthletes,
  useGlobalTeam,
  useGlobalTeams,
} from "../hooks/useGlobalDirectory";
import type {
  DirectoryFilters,
  DirectoryOrganization,
  GlobalAthlete,
  GlobalTeam,
} from "../types/global-directory.types";
import { ageFromBirthDate, totalPages } from "../utils/directory-display";

const initialFilters: DirectoryFilters = {
  search: "",
  status: "all",
  championshipId: "",
  page: 1,
  pageSize: 20,
};

export function GlobalTeamsPage({ initialOrganizationId }: { initialOrganizationId?: string }) {
  const organizations = useDirectoryOrganizations();
  const [organizationId, setOrganizationId] = useState<string | null>(
    initialOrganizationId ?? null,
  );
  const [filters, setFilters] = useState(initialFilters);
  const teams = useGlobalTeams(organizationId, filters);

  useDefaultOrganization(organizations.data, organizationId, setOrganizationId);

  return (
    <DirectoryShell
      title="Equipes"
      description="Cadastros canônicos da organização e suas participações por campeonato."
      organizations={organizations.data ?? []}
      organizationsLoading={organizations.isLoading}
      organizationId={organizationId}
      onOrganizationChange={(value) => {
        setOrganizationId(value);
        setFilters(initialFilters);
      }}
      filters={filters}
      onFiltersChange={setFilters}
      championships={teams.data?.championships ?? []}
      total={teams.data?.total ?? 0}
      loading={teams.isLoading}
      error={teams.isError}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teams.data?.items.map((team) => (
          <TeamDirectoryCard key={team.id} team={team} organizationId={organizationId!} />
        ))}
      </div>
    </DirectoryShell>
  );
}

export function GlobalAthletesPage({ initialOrganizationId }: { initialOrganizationId?: string }) {
  const organizations = useDirectoryOrganizations();
  const [organizationId, setOrganizationId] = useState<string | null>(
    initialOrganizationId ?? null,
  );
  const [filters, setFilters] = useState(initialFilters);
  const athletes = useGlobalAthletes(organizationId, filters);

  useDefaultOrganization(organizations.data, organizationId, setOrganizationId);

  return (
    <DirectoryShell
      title="Atletas"
      description="Atletas da organização e seus vínculos competitivos, sem duplicar cadastros."
      organizations={organizations.data ?? []}
      organizationsLoading={organizations.isLoading}
      organizationId={organizationId}
      onOrganizationChange={(value) => {
        setOrganizationId(value);
        setFilters(initialFilters);
      }}
      filters={filters}
      onFiltersChange={setFilters}
      championships={athletes.data?.championships ?? []}
      total={athletes.data?.total ?? 0}
      loading={athletes.isLoading}
      error={athletes.isError}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {athletes.data?.items.map((athlete) => (
          <AthleteDirectoryCard
            key={athlete.id}
            athlete={athlete}
            organizationId={organizationId!}
          />
        ))}
      </div>
    </DirectoryShell>
  );
}

function DirectoryShell({
  title,
  description,
  organizations,
  organizationsLoading,
  organizationId,
  onOrganizationChange,
  filters,
  onFiltersChange,
  championships,
  total,
  loading,
  error,
  children,
}: {
  title: string;
  description: string;
  organizations: DirectoryOrganization[];
  organizationsLoading: boolean;
  organizationId: string | null;
  onOrganizationChange: (value: string) => void;
  filters: DirectoryFilters;
  onFiltersChange: (value: DirectoryFilters) => void;
  championships: Array<{ id: string; name: string }>;
  total: number;
  loading: boolean;
  error: boolean;
  children: React.ReactNode;
}) {
  const pages = totalPages(total, filters.pageSize);
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {organizationsLoading ? (
        <Loading />
      ) : organizations.length === 0 ? (
        <Alert>
          <AlertTitle>Nenhuma organização disponível</AlertTitle>
          <AlertDescription>
            Seu usuário ainda não possui vínculo com uma organização.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Card>
            <CardContent className="grid gap-4 pt-[var(--panel-padding)] md:grid-cols-4">
              <Filter label="Organização">
                <Select value={organizationId ?? ""} onValueChange={onOrganizationChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((organization) => (
                      <SelectItem key={organization.id} value={organization.id}>
                        {organization.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Filter>
              <Filter label="Busca">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={filters.search}
                    placeholder={`Buscar ${title.toLowerCase()}...`}
                    onChange={(event) =>
                      onFiltersChange({ ...filters, search: event.target.value, page: 1 })
                    }
                  />
                </div>
              </Filter>
              <Filter label="Campeonato">
                <Select
                  value={filters.championshipId || "all"}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      championshipId: value === "all" ? "" : value,
                      page: 1,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {championships.map((championship) => (
                      <SelectItem key={championship.id} value={championship.id}>
                        {championship.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Filter>
              <Filter label="Status">
                <Select
                  value={filters.status}
                  onValueChange={(status) => onFiltersChange({ ...filters, status, page: 1 })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </Filter>
            </CardContent>
          </Card>

          {loading ? (
            <Loading />
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>Falha ao carregar</AlertTitle>
              <AlertDescription>
                Não foi possível consultar o diretório da organização.
              </AlertDescription>
            </Alert>
          ) : total === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Nenhum cadastro encontrado para os filtros selecionados.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{total} cadastro(s)</span>
                <span>
                  Página {filters.page} de {pages}
                </span>
              </div>
              {children}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={filters.page <= 1}
                  onClick={() => onFiltersChange({ ...filters, page: filters.page - 1 })}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
                </Button>
                <Button
                  variant="outline"
                  disabled={filters.page >= pages}
                  onClick={() => onFiltersChange({ ...filters, page: filters.page + 1 })}
                >
                  Próxima <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function TeamDirectoryCard({ team, organizationId }: { team: GlobalTeam; organizationId: string }) {
  return (
    <Link
      to="/teams/$teamId"
      params={{ teamId: team.id }}
      search={{ organizationId }}
      className="block rounded-[var(--radius-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full transition-colors hover:border-primary/40">
        <CardHeader className="flex-row items-start gap-3">
          {team.crest_url ? (
            <img src={team.crest_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
          ) : (
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </span>
          )}
          <div className="min-w-0">
            <CardTitle className="truncate">{team.name}</CardTitle>
            <CardDescription>{team.abbreviation || team.short_name || "Sem sigla"}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {[team.city, team.state].filter(Boolean).join(" · ") || "Local não informado"}
          </p>
          <Badge variant="secondary">{team.participations.length} participação(ões)</Badge>
        </CardContent>
      </Card>
    </Link>
  );
}

function AthleteDirectoryCard({
  athlete,
  organizationId,
}: {
  athlete: GlobalAthlete;
  organizationId: string;
}) {
  return (
    <Link
      to="/athletes/$athleteId"
      params={{ athleteId: athlete.id }}
      search={{ organizationId }}
      className="block rounded-[var(--radius-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full transition-colors hover:border-primary/40">
        <CardHeader className="flex-row items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={athlete.photo_url ?? undefined} />
            <AvatarFallback>
              <UserRound className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <CardTitle className="truncate">{athlete.sport_name || athlete.full_name}</CardTitle>
            <CardDescription className="truncate">{athlete.full_name}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">{athlete.participations.length} vínculo(s)</Badge>
        </CardContent>
      </Card>
    </Link>
  );
}

export function GlobalTeamDetailPage({
  teamId,
  organizationId,
}: {
  teamId: string;
  organizationId: string;
}) {
  const team = useGlobalTeam(organizationId, teamId);
  return (
    <DetailShell
      backTo="/teams"
      organizationId={organizationId}
      loading={team.isLoading}
      error={team.isError}
    >
      {team.data && (
        <>
          <div className="flex items-center gap-4">
            {team.data.crest_url ? (
              <img
                src={team.data.crest_url}
                alt=""
                className="h-20 w-20 rounded-2xl object-cover"
              />
            ) : (
              <span className="grid h-20 w-20 place-items-center rounded-2xl bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </span>
            )}
            <div>
              <h1 className="text-2xl font-bold">{team.data.name}</h1>
              <p className="text-muted-foreground">
                {[team.data.city, team.data.state].filter(Boolean).join(" · ") ||
                  "Local não informado"}
              </p>
            </div>
          </div>
          <ParticipationCard participations={team.data.participations} />
        </>
      )}
    </DetailShell>
  );
}

export function GlobalAthleteDetailPage({
  athleteId,
  organizationId,
}: {
  athleteId: string;
  organizationId: string;
}) {
  const athlete = useGlobalAthlete(organizationId, athleteId);
  const age = ageFromBirthDate(athlete.data?.birth_date ?? null);
  return (
    <DetailShell
      backTo="/athletes"
      organizationId={organizationId}
      loading={athlete.isLoading}
      error={athlete.isError}
    >
      {athlete.data && (
        <>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={athlete.data.photo_url ?? undefined} />
              <AvatarFallback>
                <UserRound className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {athlete.data.sport_name || athlete.data.full_name}
              </h1>
              <p className="text-muted-foreground">
                {athlete.data.full_name}
                {age !== null ? ` · ${age} anos` : ""}
              </p>
            </div>
          </div>
          <ParticipationCard participations={athlete.data.participations} />
        </>
      )}
    </DetailShell>
  );
}

function DetailShell({
  backTo,
  organizationId,
  loading,
  error,
  children,
}: {
  backTo: "/teams" | "/athletes";
  organizationId: string;
  loading: boolean;
  error: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <Button variant="ghost" asChild>
        <Link to={backTo} search={{ organizationId }}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Link>
      </Button>
      {loading ? (
        <Loading />
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Cadastro não encontrado</AlertTitle>
          <AlertDescription>
            O registro não existe nesta organização ou seu usuário não possui acesso.
          </AlertDescription>
        </Alert>
      ) : (
        children
      )}
    </div>
  );
}

function ParticipationCard({ participations }: { participations: GlobalTeam["participations"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Participações competitivas</CardTitle>
        <CardDescription>Vínculos canônicos com campeonatos e equipes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {participations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma participação registrada.</p>
        ) : (
          participations.map((participation) => (
            <div
              key={participation.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div>
                <div className="flex items-center gap-2 font-medium">
                  <Trophy className="h-4 w-4 text-primary" />
                  {participation.championship_name}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {participation.team_name}
                  {participation.position ? ` · ${participation.position}` : ""}
                  {participation.shirt_number !== null && participation.shirt_number !== undefined
                    ? ` · #${participation.shirt_number}`
                    : ""}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/championships/$id" params={{ id: participation.championship_id }}>
                  Abrir campeonato
                </Link>
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex min-h-40 items-center justify-center text-muted-foreground">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando...
    </div>
  );
}

function useDefaultOrganization(
  organizations: DirectoryOrganization[] | undefined,
  organizationId: string | null,
  setOrganizationId: (value: string) => void,
) {
  useEffect(() => {
    if (
      organizations?.length &&
      (!organizationId || !organizations.some((organization) => organization.id === organizationId))
    ) {
      setOrganizationId(organizations[0].id);
    }
  }, [organizationId, organizations, setOrganizationId]);
}
