import type { LucideIcon } from "lucide-react";

import { LuminaMetricCard } from "@/components/lumina/workspace";
import { RuntimeSparkline } from "./RuntimeSparkline";

export interface RuntimeMetricTileProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  accent?: "violet" | "magenta" | "cyan" | "gold";
  trend?: number[];
  className?: string;
}

const ACCENT_STROKE = {
  violet: "hsl(var(--violet))",
  magenta: "hsl(var(--magenta))",
  cyan: "hsl(var(--cyan))",
  gold: "hsl(var(--gold))",
} as const;

export function RuntimeMetricTile({
  label,
  value,
  hint,
  icon: Icon,
  accent="violet",
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
            width={220}
            height={36}
            stroke={ACCENT_STROKE[accent]}
            fill={ACCENT_STROKE[accent].replace(")", " / 0.14)")}
            className="w-full"
          />
        ) : null
      }
      footer={hint}
    />
  );
}

export default RuntimeMetricTile;
