import type {
  HTMLAttributes,
} from "react";

import {
  electricContour,
  premiumSurfaces,
} from "@/components/design-system/lumina";

type LuminaStandardPremiumPanelProps =
  HTMLAttributes<HTMLDivElement>;

const standardPremiumPanelClass = [
  "rounded-[26px] p-5",
  premiumSurfaces.base.panel,
  electricContour.strength.standard,
].join(" ");

export function LuminaStandardPremiumPanel({
  className,
  ...props
}: LuminaStandardPremiumPanelProps) {
  return (
    <div
      className={[
        standardPremiumPanelClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
