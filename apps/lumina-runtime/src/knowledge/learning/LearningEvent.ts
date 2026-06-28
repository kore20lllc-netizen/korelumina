export type LearningEventType =
  | "implementation"
  | "validation"
  | "failure"
  | "recovery"
  | "decision"
  | "reconciliation"
  | "customer-signal";

export interface LearningEvent {
  id: string;

  type: LearningEventType;

  title: string;

  summary: string;

  source: string;

  metadata: Record<
    string,
    unknown
  >;

  occurredAt: number;
}
