import type {
  ReactNode,
} from "react";

import {
  cn,
} from "@/lib/utils";

export interface LuminaWorkspaceToolbarProps {
  leading?: ReactNode;

  center?: ReactNode;

  trailing?: ReactNode;

  className?: string;
}

export function LuminaWorkspaceToolbar({
  leading,
  center,
  trailing,
  className,
}: LuminaWorkspaceToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        "xl:flex-row",
        "xl:items-center",
        "rounded-3xl",
        "border",
        "[border-color:var(--lumina-border-standard)]",
        "[background:var(--lumina-surface-compact)]",
        "[backdrop-filter:var(--lumina-blur-surface)]",
        "[box-shadow:var(--lumina-shadow-panel)]",
        "px-5",
        "py-4",
        className,
      )}
    >
      <div
        className="
          flex
          items-center
          gap-3
          xl:min-w-[260px]
        "
      >
        {leading}
      </div>

      <div
        className="
          flex-1
          flex
          justify-center
          overflow-x-auto
        "
      >
        {center}
      </div>

      <div
        className="
          flex
          flex-wrap
          items-center
          justify-end
          gap-2
          xl:min-w-[260px]
        "
      >
        {trailing}
      </div>
    </div>
  );
}

export default LuminaWorkspaceToolbar;
