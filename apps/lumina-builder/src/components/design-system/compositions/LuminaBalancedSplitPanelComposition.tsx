import type {
  ReactNode,
} from "react";

type LuminaBalancedSplitPanelCompositionProps = {
  primaryRegion: ReactNode;
  secondaryRegion: ReactNode;
  className?: string;
};

export function LuminaBalancedSplitPanelComposition({
  primaryRegion,
  secondaryRegion,
  className,
}: LuminaBalancedSplitPanelCompositionProps) {
  return (
    <div
      className={[
        "grid items-stretch gap-5 xl:grid-cols-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {primaryRegion}
      {secondaryRegion}
    </div>
  );
}
