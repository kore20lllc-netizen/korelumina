import type {
  KnowledgeAcquisitionMetrics,
} from "./KnowledgeAcquisitionMetrics.js";

export class KnowledgeAcquisitionMetricsRegistry {
  private readonly metrics: KnowledgeAcquisitionMetrics[] =
    [];

  record(
    metric: KnowledgeAcquisitionMetrics,
  ): void {
    this.metrics.push(
      metric,
    );
  }

  latest():
    | KnowledgeAcquisitionMetrics
    | undefined {
    return this.metrics.at(
      -1,
    );
  }

  list():
    readonly KnowledgeAcquisitionMetrics[] {
    return this.metrics;
  }

  clear(): void {
    this.metrics.length = 0;
  }
}
