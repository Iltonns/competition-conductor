import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: number;
  markOnlyLabel?: string;
}

export function IsArenaLogo({
  className,
  showWordmark = true,
  size = 32,
  markOnlyLabel = "IS Arena",
}: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)} aria-label={markOnlyLabel}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="isa-neon" x1="0" y1="0" x2="40" y2="40">
            <stop offset="0" stopColor="oklch(0.95 0.24 128)" />
            <stop offset="1" stopColor="oklch(0.82 0.22 140)" />
          </linearGradient>
        </defs>
        <path
          d="M8 5.5h23.5l4 5.5-4 5.5H16.7l-3.1 3.5 3.1 3.5h14.8l4 5.5-4 5.5H8l-4-5.5 4-5.5h14.8l3.1-3.5-3.1-3.5H8l-4-5.5 4-5.5Z"
          fill="oklch(0.12 0.02 255)"
          stroke="oklch(1 0 0 / 0.08)"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d="M2.5 12h7.5M1.5 17h6M3 28h7"
          stroke="url(#isa-neon)"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.65"
        />
        <path d="M11.5 11h4v18h-4z" fill="white" />
        <path
          d="M30.5 11H21l-3.5 4.5L21 20h6l1.5 2-1.5 3h-9.5"
          stroke="url(#isa-neon)"
          strokeWidth="3.4"
          strokeLinecap="square"
          strokeLinejoin="miter"
          fill="none"
        />
      </svg>
      {showWordmark && (
        <span className="font-display text-[14px] font-extrabold uppercase tracking-[-0.035em] text-foreground">
          IS <span className="text-neon">Arena</span>
        </span>
      )}
    </div>
  );
}
