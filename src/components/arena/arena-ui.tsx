import type { ComponentType, SVGProps } from "react";
import { CalendarDays, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArenaTeam, TeamTone } from "@/data/arena-demo";

const CREST_TONES: Record<TeamTone, string> = {
  amber: "border-amber-300/35 bg-amber-400/15 text-amber-300 shadow-amber-300/10",
  emerald: "border-emerald-300/35 bg-emerald-400/15 text-emerald-300 shadow-emerald-300/10",
  violet: "border-violet-300/35 bg-violet-400/15 text-violet-300 shadow-violet-300/10",
  red: "border-red-300/35 bg-red-400/15 text-red-300 shadow-red-300/10",
  blue: "border-sky-300/35 bg-sky-400/15 text-sky-300 shadow-sky-300/10",
  lime: "border-lime-300/35 bg-lime-400/15 text-lime-300 shadow-lime-300/10",
};

interface TeamCrestProps {
  team: ArenaTeam;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  showStars?: boolean;
}

export function TeamCrest({ team, size = "md", className, showStars = false }: TeamCrestProps) {
  const sizes = {
    xs: "h-7 w-7 text-[7px]",
    sm: "h-9 w-9 text-[8px]",
    md: "h-12 w-12 text-[10px]",
    lg: "h-16 w-16 text-xs",
  };

  return (
    <div className={cn("relative inline-flex shrink-0", className)} aria-label={team.name}>
      {showStars && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[7px] tracking-[0.12em] text-foreground/75">
          • • •
        </span>
      )}
      <span
        className={cn(
          "team-crest grid place-items-center border font-display font-black tracking-[-0.08em] shadow-[0_8px_22px_-12px_currentColor]",
          sizes[size],
          CREST_TONES[team.tone],
        )}
      >
        {team.initials}
      </span>
    </div>
  );
}

export function PlayerAvatar({
  initials,
  className,
  size = "md",
}: {
  initials: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-8 w-8 text-[9px]",
    md: "h-10 w-10 text-[10px]",
    lg: "h-20 w-20 text-lg",
  };
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-[radial-gradient(circle_at_50%_25%,#64748b_0%,#26303b_42%,#11161c_76%)] font-display font-bold text-white shadow-[0_8px_22px_-10px_rgba(0,0,0,.9)] after:absolute after:inset-x-1 after:bottom-0 after:h-2/5 after:rounded-t-full after:bg-neon/25",
        sizes[size],
        className,
      )}
    >
      <span className="relative z-10">{initials}</span>
    </span>
  );
}

export function SectionHeader({
  title,
  action,
  eyebrow,
}: {
  title: string;
  action?: string;
  eyebrow?: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neon">
            {eyebrow}
          </p>
        )}
        <h2 className="truncate font-display text-sm font-bold tracking-[-0.01em] text-foreground">
          {title}
        </h2>
      </div>
      {action && (
        <button className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-muted-foreground transition hover:bg-white/5 hover:text-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {action}
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function KpiCard({
  icon: Icon,
  value,
  label,
  tone = "neon",
  delta,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  value: string | number;
  label: string;
  tone?: "neon" | "emerald" | "amber" | "blue" | "violet";
  delta?: string;
}) {
  const tones = {
    neon: "bg-neon/10 text-neon ring-neon/20",
    emerald: "bg-emerald-400/10 text-emerald-300",
    amber: "bg-amber-400/10 text-amber-300",
    blue: "bg-sky-400/10 text-sky-300",
    violet: "bg-violet-400/10 text-violet-300",
  };
  return (
    <article className="card-arena card-interactive flex min-h-[94px] items-center gap-3.5 p-4">
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/5",
          tones[tone],
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="flex items-end gap-2">
          <strong className="font-display text-[1.75rem] font-extrabold leading-none tracking-[-0.05em]">
            {value}
          </strong>
          {delta && <span className="pb-0.5 text-[9px] font-semibold text-neon">{delta}</span>}
        </div>
        <p className="mt-1 max-w-24 text-[10px] leading-[1.3] text-muted-foreground">{label}</p>
      </div>
    </article>
  );
}

export function MatchRow({
  home,
  away,
  date,
  time,
  venue,
  phase,
  compact = false,
}: {
  home: ArenaTeam;
  away: ArenaTeam;
  date: string;
  time: string;
  venue: string;
  phase: string;
  compact?: boolean;
}) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border border-white/[0.07] bg-black/15 transition hover:border-neon/20 hover:bg-white/[0.025]",
        compact ? "p-3" : "p-4",
      )}
    >
      <p className="text-center text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {phase}
      </p>
      <div
        className={cn(
          "grid grid-cols-[1fr_auto_1fr] items-center",
          compact ? "mt-2 gap-2" : "mt-3 gap-3",
        )}
      >
        <div className="flex min-w-0 items-center justify-end gap-2">
          <span className="truncate text-right text-[11px] font-semibold sm:text-xs">
            {home.name}
          </span>
          <TeamCrest team={home} size={compact ? "xs" : "sm"} showStars={!compact} />
        </div>
        <div className="min-w-[72px] text-center">
          <p className="font-display text-[11px] font-extrabold tracking-[-0.02em] sm:text-xs">
            {date} · {time}
          </p>
          <p className="mt-0.5 max-w-[100px] truncate text-[8px] text-muted-foreground">{venue}</p>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <TeamCrest team={away} size={compact ? "xs" : "sm"} showStars={!compact} />
          <span className="truncate text-[11px] font-semibold sm:text-xs">{away.name}</span>
        </div>
      </div>
    </article>
  );
}

export interface StandingRow {
  position: number;
  team: ArenaTeam;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export function StandingsTable({
  rows,
  compact = false,
}: {
  rows: StandingRow[];
  compact?: boolean;
}) {
  return (
    <div className="compact-scrollbar overflow-x-auto">
      <table className="w-full min-w-[440px] border-separate border-spacing-0 text-[10px]">
        <thead>
          <tr className="text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
            <th className="border-b border-white/[0.07] px-2 py-2 text-left font-medium">Pos</th>
            <th className="border-b border-white/[0.07] px-2 py-2 text-left font-medium">Equipe</th>
            <th className="border-b border-white/[0.07] px-2 py-2 text-center font-medium">Pts</th>
            <th className="border-b border-white/[0.07] px-2 py-2 text-center font-medium">J</th>
            <th className="border-b border-white/[0.07] px-2 py-2 text-center font-medium">V</th>
            <th className="border-b border-white/[0.07] px-2 py-2 text-center font-medium">E</th>
            <th className="border-b border-white/[0.07] px-2 py-2 text-center font-medium">D</th>
            {!compact && (
              <th className="border-b border-white/[0.07] px-2 py-2 text-center font-medium">GP</th>
            )}
            {!compact && (
              <th className="border-b border-white/[0.07] px-2 py-2 text-center font-medium">GC</th>
            )}
            <th className="border-b border-white/[0.07] px-2 py-2 text-center font-medium">SG</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.team.id} className="group">
              <td className="border-b border-white/[0.055] px-2 py-2.5">
                <span
                  className={cn(
                    "grid h-5 w-5 place-items-center rounded text-[9px] font-bold",
                    row.position === 1
                      ? "bg-neon text-neon-foreground"
                      : "bg-white/5 text-muted-foreground",
                  )}
                >
                  {row.position}
                </span>
              </td>
              <td className="border-b border-white/[0.055] px-2 py-2.5">
                <span className="flex items-center gap-2 font-semibold">
                  <TeamCrest team={row.team} size="xs" />
                  {row.team.name}
                </span>
              </td>
              <td className="border-b border-white/[0.055] px-2 py-2.5 text-center font-display text-xs font-extrabold text-neon">
                {row.points}
              </td>
              <td className="border-b border-white/[0.055] px-2 py-2.5 text-center">
                {row.played}
              </td>
              <td className="border-b border-white/[0.055] px-2 py-2.5 text-center">{row.wins}</td>
              <td className="border-b border-white/[0.055] px-2 py-2.5 text-center">{row.draws}</td>
              <td className="border-b border-white/[0.055] px-2 py-2.5 text-center">
                {row.losses}
              </td>
              {!compact && (
                <td className="border-b border-white/[0.055] px-2 py-2.5 text-center">
                  {row.goalsFor}
                </td>
              )}
              {!compact && (
                <td className="border-b border-white/[0.055] px-2 py-2.5 text-center">
                  {row.goalsAgainst}
                </td>
              )}
              <td className="border-b border-white/[0.055] px-2 py-2.5 text-center">
                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DateVenue({ date, venue }: { date: string; venue: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <CalendarDays className="h-3 w-3" />
        {date}
      </span>
      <span className="inline-flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        {venue}
      </span>
    </div>
  );
}
