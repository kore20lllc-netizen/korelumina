import { type HTMLAttributes, forwardRef, useRef, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface GlowCardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: "violet" | "magenta" | "cyan" | "gold";
  interactive?: boolean;
}

export const GlowCard = forwardRef<HTMLDivElement, GlowCardProps>(
  ({ className, accent = "violet", interactive = false, children, onClick, ...props }, ref) => {
    const innerRef = useRef<HTMLDivElement | null>(null);
    const accentMap = {
      violet: "hover:shadow-[0_0_60px_-10px_hsl(var(--violet)/0.72)] hover:border-violet/55",
      magenta: "hover:shadow-[0_0_60px_-10px_hsl(var(--magenta)/0.72)] hover:border-magenta/55",
      cyan: "hover:shadow-[0_0_60px_-10px_hsl(var(--cyan)/0.72)] hover:border-cyan/55",
      gold: "hover:shadow-[0_0_60px_-10px_hsl(var(--gold)/0.75)] hover:border-gold/60",
    };
    const rippleColor: Record<string, string> = {
      violet: "hsl(var(--violet) / 0.55)",
      magenta: "hsl(var(--magenta) / 0.55)",
      cyan: "hsl(var(--cyan) / 0.55)",
      gold: "hsl(var(--gold) / 0.6)",
    };
    const handleClick = (e: MouseEvent<HTMLDivElement>) => {
      const host = innerRef.current;
      if (host) {
        const rect = host.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.4;
        const span = document.createElement("span");
        span.className = "glass-ripple";
        span.style.width = `${size}px`;
        span.style.height = `${size}px`;
        span.style.left = `${e.clientX - rect.left - size / 2}px`;
        span.style.top = `${e.clientY - rect.top - size / 2}px`;
        span.style.background = `radial-gradient(circle, ${rippleColor[accent]} 0%, transparent 65%)`;
        host.appendChild(span);
        window.setTimeout(() => span.remove(), 850);
      }
      onClick?.(e);
    };
    return (
      <div
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={cn(
          "glass-panel p-6 transition-all duration-500 ease-fluid overflow-hidden",
          interactive && "cursor-pointer hover:-translate-y-1",
          interactive && accentMap[accent],
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlowCard.displayName = "GlowCard";
