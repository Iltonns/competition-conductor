import { supabase } from "@/integrations/supabase/client";
import type { ArenaTeam, TeamTone } from "@/data/arena-demo";
import type { StandingRow } from "@/components/arena/arena-ui";

type ChampionshipRow = {
  id: string;
  name: string;
  season: string | null;
  status: string;
  cover_url: string | null;
};

type TeamRow = {
  id: string;
  name: string;
  short_name: string | null;
  city: string | null;
  primary_color: string | null;
};

type MatchRow = {
  id: string;
  championship_id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  phase: string | null;
  round: string | null;
  venue: string | null;
  scheduled_at: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
};

type AthleteRow = { id: string; full_name: string; team_id: string | null };
type EventRow = { athlete_id: string | null; team_id: string | null; type: string };

export interface DashboardMatch {
  id: string;
  phase: string;
  home: ArenaTeam;
  away: ArenaTeam;
  date: string;
  time: string;
  venue: string;
  homeScore?: number;
  awayScore?: number;
}

export interface DashboardScorer {
  position: number;
  name: string;
  initials: string;
  team: ArenaTeam;
  goals: number;
}

export interface DashboardData {
  activeChampionships: number;
  teams: number;
  athletes: number;
  finishedMatches: number;
  totalGoals: number;
  finalizedReports: number;
  upcomingMatches: DashboardMatch[];
  recentResults: DashboardMatch[];
  scorers: DashboardScorer[];
  standings: StandingRow[];
  performance: Array<{ month: string; goals: number }>;
  years: number[];
  featuredChampionship: ChampionshipRow | null;
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const TONES: TeamTone[] = ["amber", "emerald", "violet", "red", "blue", "lime"];

function hash(value: string) {
  return [...value].reduce((total, char) => total + char.charCodeAt(0), 0);
}

function initials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function toArenaTeam(team: TeamRow | undefined, fallback: string): ArenaTeam {
  const name = team?.name ?? fallback;
  return {
    id: team?.id ?? `missing-${fallback}`,
    name,
    shortName: team?.short_name || name,
    initials: initials(team?.short_name || name),
    city: team?.city ?? "",
    tone: TONES[hash(team?.primary_color || team?.id || name) % TONES.length],
  };
}

function assertResult<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data ?? ([] as T);
}

function matchDate(value: string | null) {
  if (!value) return { date: "A DEFINIR", time: "--:--" };
  const date = new Date(value);
  return {
    date: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
      .format(date)
      .replace(".", "")
      .toUpperCase(),
    time: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date),
  };
}

function toDashboardMatch(match: MatchRow, teams: Map<string, TeamRow>): DashboardMatch {
  const when = matchDate(match.scheduled_at);
  return {
    id: match.id,
    phase: [match.phase, match.round].filter(Boolean).join(" · ") || "Partida",
    home: toArenaTeam(match.home_team_id ? teams.get(match.home_team_id) : undefined, "Mandante"),
    away: toArenaTeam(match.away_team_id ? teams.get(match.away_team_id) : undefined, "Visitante"),
    date: when.date,
    time: when.time,
    venue: match.venue || "Local a definir",
    homeScore: match.home_score ?? undefined,
    awayScore: match.away_score ?? undefined,
  };
}

function calculateStandings(matches: MatchRow[], teams: Map<string, TeamRow>): StandingRow[] {
  const rows = new Map<string, Omit<StandingRow, "position" | "team">>();
  const get = (teamId: string) => {
    const current = rows.get(teamId) ?? {
      points: 0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
    };
    rows.set(teamId, current);
    return current;
  };

  for (const match of matches) {
    if (!match.home_team_id || !match.away_team_id) continue;
    const homeGoals = match.home_score ?? 0;
    const awayGoals = match.away_score ?? 0;
    const home = get(match.home_team_id);
    const away = get(match.away_team_id);
    home.played += 1;
    away.played += 1;
    home.goalsFor += homeGoals;
    home.goalsAgainst += awayGoals;
    away.goalsFor += awayGoals;
    away.goalsAgainst += homeGoals;
    if (homeGoals === awayGoals) {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    } else if (homeGoals > awayGoals) {
      home.wins += 1;
      away.losses += 1;
      home.points += 3;
    } else {
      away.wins += 1;
      home.losses += 1;
      away.points += 3;
    }
    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
  }

  return [...rows.entries()]
    .map(([teamId, row]) => ({ ...row, team: toArenaTeam(teams.get(teamId), "Equipe") }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.team.name.localeCompare(b.team.name),
    )
    .map((row, index) => ({ ...row, position: index + 1 }));
}

export async function fetchDashboardData(
  championshipId?: string,
  selectedYear?: number,
): Promise<DashboardData> {
  let championshipsQuery = supabase
    .from("championships")
    .select("id, name, season, status, cover_url")
    .order("created_at", { ascending: false });
  if (championshipId) championshipsQuery = championshipsQuery.eq("id", championshipId);
  const championships = assertResult(await championshipsQuery) as ChampionshipRow[];
  const championshipIds = championships.map(({ id }) => id);

  const empty: DashboardData = {
    activeChampionships: 0,
    teams: 0,
    athletes: 0,
    finishedMatches: 0,
    totalGoals: 0,
    finalizedReports: 0,
    upcomingMatches: [],
    recentResults: [],
    scorers: [],
    standings: [],
    performance: MONTHS.map((month) => ({ month, goals: 0 })),
    years: [new Date().getFullYear()],
    featuredChampionship: championships[0] ?? null,
  };
  if (championshipIds.length === 0) return empty;

  const [registrationsResult, rosterResult, matchesResult] = await Promise.all([
    supabase
      .from("championship_teams")
      .select("team_id")
      .in("championship_id", championshipIds)
      .neq("status", "archived"),
    supabase
      .from("championship_team_athletes")
      .select("athlete_id")
      .in("championship_id", championshipIds)
      .eq("active", true)
      .in("registration_status", ["registered", "approved"]),
    supabase
      .from("matches")
      .select(
        "id, championship_id, home_team_id, away_team_id, phase, round, venue, scheduled_at, home_score, away_score, status",
      )
      .in("championship_id", championshipIds),
  ]);

  const registrations = assertResult(registrationsResult) as Array<{ team_id: string }>;
  const roster = assertResult(rosterResult) as Array<{ athlete_id: string }>;
  const matches = assertResult(matchesResult) as MatchRow[];
  const teamIds = [
    ...new Set([
      ...registrations.map(({ team_id }) => team_id),
      ...matches.flatMap((match) => [match.home_team_id, match.away_team_id]).filter(Boolean),
    ]),
  ] as string[];
  const finished = matches.filter((match) => match.status === "finished");
  const matchIds = finished.map(({ id }) => id);

  const [teamsResult, eventsResult] = await Promise.all([
    teamIds.length
      ? supabase.from("teams").select("id, name, short_name, city, primary_color").in("id", teamIds)
      : Promise.resolve({ data: [], error: null }),
    matchIds.length
      ? supabase
          .from("match_events")
          .select("athlete_id, team_id, type")
          .in("match_id", matchIds)
          .eq("type", "goal")
      : Promise.resolve({ data: [], error: null }),
  ]);
  const teams = new Map((assertResult(teamsResult) as TeamRow[]).map((team) => [team.id, team]));
  const events = assertResult(eventsResult) as EventRow[];
  const athleteIds = [
    ...new Set(events.map(({ athlete_id }) => athlete_id).filter(Boolean)),
  ] as string[];
  const athletesResult = athleteIds.length
    ? await supabase.from("athletes").select("id, full_name, team_id").in("id", athleteIds)
    : { data: [], error: null };
  const athletes = new Map(
    (assertResult(athletesResult) as AthleteRow[]).map((athlete) => [athlete.id, athlete]),
  );

  const scorerCounts = new Map<string, { teamId: string | null; goals: number }>();
  for (const event of events) {
    if (!event.athlete_id) continue;
    const current = scorerCounts.get(event.athlete_id) ?? { teamId: event.team_id, goals: 0 };
    current.goals += 1;
    scorerCounts.set(event.athlete_id, current);
  }
  const scorers = [...scorerCounts.entries()]
    .map(([athleteId, score]) => {
      const athlete = athletes.get(athleteId);
      const name = athlete?.full_name ?? "Atleta não identificado";
      return {
        position: 0,
        name,
        initials: initials(name),
        team: toArenaTeam(teams.get(score.teamId || athlete?.team_id || ""), "Sem equipe"),
        goals: score.goals,
      };
    })
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
    .map((scorer, index) => ({ ...scorer, position: index + 1 }));

  const years = [
    ...new Set(
      finished
        .filter(({ scheduled_at }) => scheduled_at)
        .map(({ scheduled_at }) => new Date(scheduled_at as string).getFullYear()),
    ),
  ].sort((a, b) => b - a);
  const year = selectedYear ?? years[0] ?? new Date().getFullYear();
  if (!years.includes(year)) years.push(year);
  const performance = MONTHS.map((month) => ({ month, goals: 0 }));
  for (const match of finished) {
    if (!match.scheduled_at) continue;
    const date = new Date(match.scheduled_at);
    if (date.getFullYear() === year) {
      performance[date.getMonth()].goals += (match.home_score ?? 0) + (match.away_score ?? 0);
    }
  }

  const upcoming = matches
    .filter(
      (match) =>
        match.status === "scheduled" &&
        (!match.scheduled_at || new Date(match.scheduled_at).getTime() >= Date.now()),
    )
    .sort((a, b) => (a.scheduled_at ?? "9999").localeCompare(b.scheduled_at ?? "9999"));
  const recent = [...finished].sort((a, b) =>
    (b.scheduled_at ?? "").localeCompare(a.scheduled_at ?? ""),
  );

  return {
    activeChampionships: championships.filter(({ status }) => status === "active").length,
    teams: new Set(registrations.map(({ team_id }) => team_id).filter(Boolean)).size,
    athletes: new Set(roster.map(({ athlete_id }) => athlete_id).filter(Boolean)).size,
    finishedMatches: finished.length,
    totalGoals: finished.reduce(
      (total, match) => total + (match.home_score ?? 0) + (match.away_score ?? 0),
      0,
    ),
    finalizedReports: finished.length,
    upcomingMatches: upcoming.slice(0, 2).map((match) => toDashboardMatch(match, teams)),
    recentResults: recent.slice(0, 3).map((match) => toDashboardMatch(match, teams)),
    scorers: scorers.slice(0, 5),
    standings: calculateStandings(finished, teams),
    performance,
    years,
    featuredChampionship:
      championships.find(({ status }) => status === "active") ?? championships[0] ?? null,
  };
}
