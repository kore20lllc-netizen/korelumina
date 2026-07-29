import { ExecutiveMetricCard } from "./ExecutiveMetricCard";
import { useExecutiveRibbon } from "./ExecutiveRibbonProvider";

export function ExecutiveMetrics() {
  const { metrics } =
    useExecutiveRibbon();

  return (
    <div className="grid min-w-0 gap-4">
      {metrics.map((metric) => (
        <ExecutiveMetricCard
          key={metric.id}
          metric={metric}
        />
      ))}
    </div>
  );
}
