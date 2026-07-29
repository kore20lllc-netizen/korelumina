export type ExecutiveExperienceStage =
  | "genesis"
  | "observation"
  | "decision"
  | "implementation"
  | "validation"
  | "deployment"
  | "outcome"
  | "reflection"
  | "pattern";

export type ExecutiveExperienceStatus =
  | "open"
  | "active"
  | "completed"
  | "superseded"
  | "archived";

export interface ExecutiveExperienceNode {
  id: string;

  stage:
    ExecutiveExperienceStage;

  observationId?: string;

  memoryRecordId?: string;

  reflectionId?: string;

  patternCandidateId?: string;

  occurredAt: number;

  metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface ExecutiveExperience {
  id: string;

  title: string;

  summary?: string;

  status:
    ExecutiveExperienceStatus;

  projectId?: string;

  missionId?: string;

  workspace?: string;

  nodeIds:
    readonly string[];

  tags:
    readonly string[];

  startedAt: number;

  updatedAt: number;

  completedAt?: number;
}

export interface CreateExecutiveExperienceInput {
  id: string;

  title: string;

  summary?: string;

  status?:
    ExecutiveExperienceStatus;

  projectId?: string;

  missionId?: string;

  workspace?: string;

  nodeIds?: readonly string[];

  tags?: readonly string[];

  startedAt?: number;

  updatedAt?: number;

  completedAt?: number;
}

export function createExecutiveExperience(
  input:
    CreateExecutiveExperienceInput,
): ExecutiveExperience {
  const startedAt =
    input.startedAt ??
    Date.now();

  return Object.freeze({
    ...input,

    status:
      input.status ??
      "open",

    nodeIds:
      Object.freeze([
        ...new Set(
          input.nodeIds ?? [],
        ),
      ]),

    tags:
      Object.freeze([
        ...new Set(
          input.tags ?? [],
        ),
      ]),

    startedAt,

    updatedAt:
      input.updatedAt ??
      startedAt,
  });
}
