export type LearningInsightSeverity =
  | "info"
  | "warning"
  | "critical";

export interface LearningInsight {
  id: string;

  title: string;

  summary: string;

  severity: LearningInsightSeverity;

  patternIds: string[];

  recommendation?: string;

  metadata: Record<
    string,
    unknown
  >;

  createdAt: number;
}
