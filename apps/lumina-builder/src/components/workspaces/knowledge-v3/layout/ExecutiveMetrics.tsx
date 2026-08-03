import {
  LuminaExecutiveMetricGrid,
} from "@/components/design-system/lumina";

import {
  getExecutiveRibbonMetrics,
} from "./ExecutiveRibbon.metrics";
import {
  ExecutiveMetricCard,
} from "./ExecutiveMetricCard";

export function ExecutiveMetrics() {
  return (
    <LuminaExecutiveMetricGrid>
      {getExecutiveRibbonMetrics().map(
        (metric) => (
          <ExecutiveMetricCard
            key={metric.id}
            metric={metric}
          />
        ),
      )}
    </LuminaExecutiveMetricGrid>
  );
}
