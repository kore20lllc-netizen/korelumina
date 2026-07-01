export interface ExecutionStageResult {
  stage: string;

  success: boolean;

  error?: unknown;

  metadata?: Record<
    string,
    unknown
  >;
}

export interface ExecutionResult {
  id: string;

  success: boolean;

  stages: ExecutionStageResult[];

  metadata: Record<
    string,
    unknown
  >;
}
