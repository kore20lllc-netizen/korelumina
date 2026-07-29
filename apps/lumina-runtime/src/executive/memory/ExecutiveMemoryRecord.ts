import type {
  ExecutiveEventCategory,
  ExecutiveEventConfidence,
  ExecutiveEventEvidence,
} from "../events/index.js";

export type ExecutiveMemoryKind =
  | "genesis"
  | "decision"
  | "principle"
  | "architecture"
  | "implementation"
  | "validation"
  | "deployment"
  | "runtime"
  | "governance"
  | "mission"
  | "customer"
  | "business"
  | "reflection"
  | "knowledge";

export interface ExecutiveMemoryRecord {
  id: string;

  kind:
    ExecutiveMemoryKind;

  category:
    ExecutiveEventCategory;

  title: string;

  summary: string;

  sourceObservationIds:
    readonly string[];

  evidence:
    readonly ExecutiveEventEvidence[];

  confidence:
    ExecutiveEventConfidence;

  projectId?: string;

  missionId?: string;

  workspace?: string;

  tags:
    readonly string[];

  metadata:
    Readonly<
      Record<string, unknown>
    >;

  createdAt: number;

  updatedAt: number;
}

export interface CreateExecutiveMemoryRecordInput {
  id: string;

  kind:
    ExecutiveMemoryKind;

  category:
    ExecutiveEventCategory;

  title: string;

  summary: string;

  sourceObservationIds:
    readonly string[];

  evidence?:
    readonly ExecutiveEventEvidence[];

  confidence:
    ExecutiveEventConfidence;

  projectId?: string;

  missionId?: string;

  workspace?: string;

  tags?: readonly string[];

  metadata?: Readonly<
    Record<string, unknown>
  >;

  createdAt?: number;

  updatedAt?: number;
}

export function createExecutiveMemoryRecord(
  input:
    CreateExecutiveMemoryRecordInput,
): ExecutiveMemoryRecord {
  const createdAt =
    input.createdAt ??
    Date.now();

  return Object.freeze({
    ...input,

    sourceObservationIds:
      Object.freeze([
        ...input.sourceObservationIds,
      ]),

    evidence:
      Object.freeze(
        (input.evidence ?? []).map(
          (evidence) =>
            Object.freeze({
              ...evidence,
            }),
        ),
      ),

    tags:
      Object.freeze([
        ...new Set(
          input.tags ?? [],
        ),
      ]),

    metadata:
      Object.freeze({
        ...(input.metadata ?? {}),
      }),

    createdAt,

    updatedAt:
      input.updatedAt ??
      createdAt,
  });
}
