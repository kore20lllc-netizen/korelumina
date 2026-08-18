import type {
  HTMLAttributes,
} from "react";

import {
  electricContour,
  premiumSurfaces,
} from "@/components/design-system/lumina";

type LuminaProminentPremiumPanelProps =
  HTMLAttributes<HTMLElement>;

const prominentPremiumPanelClass = [
  "rounded-[28px] p-6",
  premiumSurfaces.base.panel,
  electricContour.strength.prominent,
].join(" ");

export function LuminaProminentPremiumPanel({
  className,
  ...props
}: LuminaProminentPremiumPanelProps) {
  return (
    <header
      className={[
        prominentPremiumPanelClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
