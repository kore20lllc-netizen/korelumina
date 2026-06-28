export interface LearningPattern {
  id: string;

  title: string;

  summary: string;

  eventIds: string[];

  confidence: number;

  metadata: Record<
    string,
    unknown
  >;

  discoveredAt: number;

  updatedAt: number;
}
