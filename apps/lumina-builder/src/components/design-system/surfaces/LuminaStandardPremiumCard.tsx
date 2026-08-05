import type {
  HTMLAttributes,
} from "react";

import {
  electricContour,
  premiumSurfaces,
} from "@/components/design-system/lumina";

type LuminaStandardPremiumCardProps =
  HTMLAttributes<HTMLElement> & {
    as?: "article" | "div";
  };

const standardPremiumCardClass = [
  "rounded-[18px] p-4",
  premiumSurfaces.base.card,
  electricContour.strength.standard,
].join(" ");

export function LuminaStandardPremiumCard({
  as = "div",
  className,
  ...props
}: LuminaStandardPremiumCardProps) {
  const resolvedClassName = [
    standardPremiumCardClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (as === "article") {
    return (
      <article
        className={resolvedClassName}
        {...props}
      />
    );
  }

  return (
    <div
      className={resolvedClassName}
      {...props}
    />
  );
}
