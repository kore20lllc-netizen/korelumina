import { border, glass, radius, shadow } from "../theme/appearance";
import type { RibbonMetric } from "./ExecutiveRibbon.metrics";

interface ExecutiveMetricCardProps {
  metric: RibbonMetric;
}

export function ExecutiveMetricCard({
  metric,
}: ExecutiveMetricCardProps) {
  const Icon = metric.icon;

  return (
    <section
      className={[
        "relative",
        "overflow-hidden",
        radius.card,
        glass.card,
        border.subtle,
        shadow.soft,
        "px-5",
        "py-4",
        "transition-all",
        "duration-300",
        "hover:-translate-y-1",
        "hover:border-white/16",
      ].join(" ")}
    >
      <div
        aria-hidden="true"
        className="
          absolute
          inset-0
          opacity-0
          transition-opacity
          duration-300
          group-hover:opacity-100
          [background:radial-gradient(circle_at_top_right,rgba(255,255,255,.08),transparent_55%)]
        "
      />

      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/52">
            {metric.label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-white">
            {metric.value}
          </p>
        </div>

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
              "h-5",
              "w-5",
              metric.accent,
            ].join(" ")}
          />
        </span>
      </div>

      <p className="relative mt-4 text-[11px] leading-5 text-white/46">
        {metric.detail}
      </p>
    </section>
  );
}
