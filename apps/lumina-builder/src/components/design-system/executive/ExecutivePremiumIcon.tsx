import type { LucideIcon } from "lucide-react";

import { ExecutiveIconFrame } from "./ExecutiveIconFrame";
import { ExecutiveStatusHalo } from "./ExecutiveStatusHalo";
import {
  executiveIconTheme,
  type ExecutiveIconState,
} from "./executiveIconTheme";

interface ExecutivePremiumIconProps {
  icon: LucideIcon;
  state: ExecutiveIconState;
}

export function ExecutivePremiumIcon({
  icon: Icon,
  state,
}: ExecutivePremiumIconProps) {
  const theme = executiveIconTheme[state];

  return (
    <ExecutiveIconFrame
      className={[
        theme.frame,
        theme.glow,
        theme.icon,
      ].join(" ")}
    >
      <ExecutiveStatusHalo
        className={theme.halo}
      />

      <Icon
        className="relative z-10 h-3.5 w-3.5"
        strokeWidth={1.8}
      />
    </ExecutiveIconFrame>
  );
}
