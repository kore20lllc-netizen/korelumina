import type {
  LucideIcon,
} from "lucide-react";

import {
  LuminaMetricCard,
} from "@/components/lumina/workspace";

import {
  RuntimeSparkline,
  type RuntimeTelemetryMode,
} from "./RuntimeSparkline";

export interface RuntimeMetricTileProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  accent?:
    | "violet"
    | "magenta"
    | "cyan"
    | "gold";
  visualization?: RuntimeTelemetryMode;
  trend?: number[];
  className?: string;
}

const ACCENT_STROKE = {
  violet:
    "hsl(var(--violet))",

  magenta:
    "hsl(var(--magenta))",

  cyan:
    "hsl(var(--cyan))",

  gold:
    "hsl(var(--gold))",
} as const;

const ACCENT_FILL = {
  violet:
    "hsl(var(--violet) / 0.14)",

  magenta:
    "hsl(var(--magenta) / 0.14)",

  cyan:
    "hsl(var(--cyan) / 0.14)",

  gold:
    "hsl(var(--gold) / 0.14)",
} as const;

export function RuntimeMetricTile({
  label,
  value,
  hint,
  icon: Icon,
  accent = "violet",
  visualization = "signal",
  trend,
  className,
}: RuntimeMetricTileProps) {
  return (
    <LuminaMetricCard
      className={className}
      label={label}
      value={value}
      icon={
        Icon && (
          <Icon
            className="h-5 w-5 text-muted-foreground"
            strokeWidth={1.75}
          />
        )
      }
      accent={
        trend?.length ? (
          <RuntimeSparkline
            data={trend}
            mode={visualization}
            width={220}
            height={36}
            stroke={
              ACCENT_STROKE[
                accent
              ]
            }
            fill={
              ACCENT_FILL[
                accent
              ]
            }
            className="h-14 w-full"
            label={`${label} telemetry`}
          />
        ) : null
      }
      footer={hint}
    />
  );
}

export default RuntimeMetricTile;
