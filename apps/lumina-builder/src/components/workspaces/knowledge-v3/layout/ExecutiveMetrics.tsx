import { getExecutiveRibbonMetrics } from "./ExecutiveRibbon.metrics";
import { ExecutiveMetricCard } from "./ExecutiveMetricCard";
import { useKnowledgeOperationsTruth } from "./useKnowledgeOperationsTruth";

export function ExecutiveMetrics() {
  const truth = useKnowledgeOperationsTruth();

  return (
    <div className="grid min-w-0 gap-4">
      {getExecutiveRibbonMetrics(truth).map((metric) => (
        <ExecutiveMetricCard
          key={metric.id}
          metric={metric}
        />
      ))}
    </div>
  );
}
