import { cn } from "@/lib/utils";
import { executiveMaterial, gradients, lighting } from "../theme/appearance";
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
    <section
      className={cn(
        "group/card relative min-w-0 overflow-hidden transition-all duration-500",
        "hover:-translate-y-1",
        "hover:shadow-[0_0_0_1px_rgba(59,130,246,.22),0_0_30px_rgba(37,99,235,.24),0_22px_54px_rgba(2,6,23,.34),inset_0_0_20px_rgba(56,189,248,.06)]",
        executiveMaterial.primary.radius,
        executiveMaterial.primary.border,
        executiveMaterial.primary.glass,
        executiveMaterial.primary.shadow,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0",
          gradients.executiveAmbient,
        )}
      />

      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-[9%] top-0 h-px",
          lighting.executiveReflection,
        )}
      />

      <div className="relative z-10 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/72">
              {metric.label}
            </p>

            <p className="mt-2 text-2xl font-bold tracking-tight text-white">
              {metric.value}
            </p>
          </div>

          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
              "border border-blue-400/55",
              "ring-1 ring-inset ring-cyan-300/18",
              "bg-[radial-gradient(circle_at_30%_20%,rgba(125,211,252,.16),transparent_52%),linear-gradient(145deg,rgba(37,99,235,.14),rgba(8,47,73,.10))]",
              "shadow-[0_0_0_1px_rgba(59,130,246,.10),0_0_18px_rgba(37,99,235,.18),inset_0_1px_0_rgba(255,255,255,.08)]",
              metric.surface,
            )}
          >
            <Icon
              className={cn(
                "h-4.5 w-4.5",
                metric.accent,
              )}
            />
          </span>
        </div>

        <p className="mt-4 text-[11px] leading-5 text-white/48">
          {metric.detail}
        </p>
      </div>
    </section>
  );
}
