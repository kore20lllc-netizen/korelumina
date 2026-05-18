import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface GlowCardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: "violet" | "magenta" | "cyan" | "gold";
  interactive?: boolean;
}

export const GlowCard = forwardRef<HTMLDivElement, GlowCardProps>(
  ({ className, accent = "violet", interactive = false, children, ...props }, ref) => {
    const accentMap = {
      violet: "hover:shadow-[0_0_50px_-10px_hsl(var(--violet)/0.55)] hover:border-violet/40",
      magenta: "hover:shadow-[0_0_50px_-10px_hsl(var(--magenta)/0.55)] hover:border-magenta/40",
      cyan: "hover:shadow-[0_0_50px_-10px_hsl(var(--cyan)/0.55)] hover:border-cyan/40",
      gold: "hover:shadow-[0_0_50px_-10px_hsl(var(--gold)/0.55)] hover:border-gold/40",
    };
    return (
      <div
        ref={ref}
        className={cn(
          "glass-panel p-6 transition-all duration-500 ease-fluid",
          interactive && "cursor-pointer hover:-translate-y-1",
          interactive && accentMap[accent],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlowCard.displayName = "GlowCard";
