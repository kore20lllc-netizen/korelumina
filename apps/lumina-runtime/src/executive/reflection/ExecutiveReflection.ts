export type ExecutiveReflectionStatus =
  | "draft"
  | "reviewing"
  | "published"
  | "archived";

export interface ExecutiveReflectionRecord {
  readonly id: string;
  readonly sessionId: string;
  readonly title: string;
  readonly summary: string;
  readonly findings: readonly string[];
  readonly recommendations: readonly string[];
  readonly authorId: string;
  readonly status: ExecutiveReflectionStatus;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface CreateExecutiveReflectionRecordInput {
  id: string;
  sessionId: string;
  title: string;
  summary: string;
  authorId: string;
  findings?: readonly string[];
  recommendations?: readonly string[];
  status?: ExecutiveReflectionStatus;
  createdAt?: number;
  metadata?: Readonly<Record<string, unknown>>;
}

export function createExecutiveReflectionRecord(
  input: CreateExecutiveReflectionRecordInput,
): ExecutiveReflectionRecord {
  const now = input.createdAt ?? Date.now();

  return Object.freeze({
    id: input.id.trim(),
    sessionId: input.sessionId.trim(),
    title: input.title.trim(),
    summary: input.summary.trim(),
    findings: Object.freeze([...(input.findings ?? [])]),
    recommendations: Object.freeze([
      ...(input.recommendations ?? []),
    ]),
    authorId: input.authorId.trim(),
    status: input.status ?? "draft",
    createdAt: now,
    updatedAt: now,
    metadata: Object.freeze({
      ...(input.metadata ?? {}),
    }),
  });
}
