import type {
  HTMLAttributes,
  ReactNode,
} from "react";

type LuminaExecutiveTitleMetricsCompositionVariant =
  | "balanced"
  | "balanced-explicit"
  | "content-led";

type LuminaExecutiveTitleMetricsCompositionProps =
  Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    titleRegion: ReactNode;
    metricsRegion: ReactNode;
    variant?: LuminaExecutiveTitleMetricsCompositionVariant;
  };

const variantClasses: Record<
  LuminaExecutiveTitleMetricsCompositionVariant,
  string
> = {
  balanced:
    "xl:grid-cols-2",
  "balanced-explicit":
    "xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]",
  "content-led":
    "xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,.85fr)]",
};

export function LuminaExecutiveTitleMetricsComposition({
  titleRegion,
  metricsRegion,
  variant = "balanced",
  className,
  ...props
}: LuminaExecutiveTitleMetricsCompositionProps) {
  const resolvedClassName = [
    "grid items-stretch gap-5",
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={resolvedClassName}
      {...props}
    >
      {titleRegion}
      {metricsRegion}
    </div>
  );
}
