import type { HTMLAttributes } from "react";

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
        "relative overflow-hidden rounded-2xl",
        "border border-white/10",
        "bg-white/[0.04]",
        "backdrop-blur-2xl",
        "shadow-[0_20px_60px_-20px_rgba(0,0,0,0.55)]",
        "transition-all duration-300",
        hover &&
          "hover:border-violet-500/30 hover:bg-white/[0.06]",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export default WorkspaceCard;
