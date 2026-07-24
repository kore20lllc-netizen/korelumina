import { RIBBON_METRICS } from "./ExecutiveRibbon.metrics";
import { ExecutiveMetricCard } from "./ExecutiveMetricCard";

export function ExecutiveMetrics() {
  return (
    <div
      className="
        grid
        gap-4
        sm:grid-cols-3
      "
    >
      {RIBBON_METRICS.map((metric) => (
        <ExecutiveMetricCard
          key={metric.id}
          metric={metric}
        />
      ))}
    </div>
  );
}
