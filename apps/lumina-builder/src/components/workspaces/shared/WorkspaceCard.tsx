import type {
  HTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

interface WorkspaceCardProps
  extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function WorkspaceCard({
  className,
  hover = false,
  children,
  ...props
}: WorkspaceCardProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        "[border-radius:var(--lumina-radius-surface)]",
        "border",
        "[border-color:var(--lumina-border-standard)]",
        "[background:var(--lumina-surface-card)]",
        "[backdrop-filter:var(--lumina-blur-surface)]",
        "[box-shadow:var(--lumina-shadow-panel)]",
        "transition-all duration-300",
        hover && [
          "hover:[border-color:var(--lumina-border-emphasis)]",
          "hover:[background:var(--lumina-surface-interactive)]",
          "hover:[box-shadow:var(--lumina-shadow-hover)]",
        ],
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export default WorkspaceCard;
