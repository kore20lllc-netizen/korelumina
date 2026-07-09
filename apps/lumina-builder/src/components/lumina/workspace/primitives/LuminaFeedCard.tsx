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
          "transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05]",
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
