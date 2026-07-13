import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { LuminaWorkspacePanel } from "../LuminaWorkspacePanel";

export interface LuminaFeedCardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}

export function LuminaFeedCard({
  children,
  className,
  interactive = true,
}: LuminaFeedCardProps) {
  return (
    <LuminaWorkspacePanel
      className={cn(
        "overflow-hidden",
        interactive &&
          [
            "transition-all duration-200",
            "hover:[border-color:var(--lumina-border-emphasis)]",
            "hover:[background:var(--lumina-surface-interactive)]",
            "hover:[box-shadow:var(--lumina-shadow-hover)]",
          ],
        className,
      )}
    >
      <div className="p-4">
        {children}
      </div>
    </LuminaWorkspacePanel>
  );
}

export default LuminaFeedCard;
