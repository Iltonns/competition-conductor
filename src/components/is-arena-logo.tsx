import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}

export function IsArenaLogo({ className, showWordmark = true, size = 32 }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
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
        <rect x="1" y="1" width="38" height="38" rx="10" fill="oklch(0.18 0.03 260)" stroke="oklch(1 0 0 / 0.08)" />
        {/* Speed lines */}
        <path
          d="M4 30 L14 30"
          stroke="url(#isa-neon)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M4 34 L10 34"
          stroke="url(#isa-neon)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.3"
        />
        {/* Stylised "I" */}
        <rect x="10" y="9" width="4" height="22" rx="1.2" fill="white" />
        {/* Stylised "S" — angular sports mark */}
        <path
          d="M30 10 L20 10 C17.8 10 16 11.8 16 14 C16 16.2 17.8 18 20 18 L26 18 C28.2 18 30 19.8 30 22 C30 24.2 28.2 26 26 26 L16 26"
          stroke="url(#isa-neon)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-extrabold tracking-tight text-foreground">
            IS <span className="text-neon">Arena</span>
          </span>
          <span className="mt-0.5 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            Sports OS
          </span>
        </div>
      )}
    </div>
  );
}
