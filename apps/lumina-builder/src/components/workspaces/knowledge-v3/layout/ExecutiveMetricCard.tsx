import { KnowledgeExecutiveCard } from "../primitives/KnowledgeExecutiveCard";
import type { RibbonMetric } from "./ExecutiveRibbon.metrics";

interface ExecutiveMetricCardProps {
  metric: RibbonMetric;
}

type AccentKey =
  | "slate"
  | "cyan"
  | "emerald"
  | "violet"
  | "amber"
  | "rose"
  | "blue"
  | "orange";

function resolveAccentKey(accent: string): AccentKey {
  if (accent.includes("amber")) return "amber";
  if (accent.includes("emerald")) return "emerald";
  if (accent.includes("violet")) return "violet";
  if (accent.includes("rose")) return "rose";
  if (accent.includes("orange")) return "orange";
  if (accent.includes("blue")) return "blue";
  if (accent.includes("slate")) return "slate";
  return "cyan";
}

export function ExecutiveMetricCard({
  metric,
}: ExecutiveMetricCardProps) {
  const Icon = metric.icon;

  return (
    <KnowledgeExecutiveCard
      title={metric.label}
      value={metric.value}
      description={metric.detail}
      accentKey={resolveAccentKey(metric.accent)}
      icon={
        <span
          className={[
            "flex",
            "h-11",
            "w-11",
            "items-center",
            "justify-center",
            "rounded-2xl",
            "border",
            metric.surface,
          ].join(" ")}
        >
          <Icon
            className={[
              "h-4.5",
              "w-4.5",
              metric.accent,
            ].join(" ")}
          />
        </span>
      }
    />
  );
}
