import { RIBBON_METRICS } from "./ExecutiveRibbon.metrics";
import { ExecutiveMetricCard } from "./ExecutiveMetricCard";

export function ExecutiveMetrics() {
  return (
    <div className="grid min-w-0 gap-4">
      {RIBBON_METRICS.map((metric) => (
        <ExecutiveMetricCard
          key={metric.id}
          metric={metric}
        />
      ))}
    </div>
  );
}
