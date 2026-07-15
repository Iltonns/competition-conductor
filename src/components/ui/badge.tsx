import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[calc(var(--radius-sm)+1px)] border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] transition-[background-color,border-color,color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-standard)] focus:outline-none focus:ring-2 focus:ring-ring",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-[var(--shadow-soft)] hover:bg-primary/86",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/84",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-[var(--shadow-soft)] hover:bg-destructive/84",
        outline: "border-border bg-card/60 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
