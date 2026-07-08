import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface LuminaWorkspaceToolbarProps {
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}

export function LuminaWorkspaceToolbar({
  leading,
  trailing,
  className,
}: LuminaWorkspaceToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-3xl border border-white/10 bg-white/[0.025] px-4 py-3 backdrop-blur-xl",
        className,
      )}
    >
      <div className="min-w-0">
        {leading}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {trailing}
      </div>
    </div>
  );
}

export default LuminaWorkspaceToolbar;
