export const knowledgeManufacturingStages = [
  "Evidence Intake",
  "Documentation Compiler",
  "Conversation Compiler",
  "Git Compiler",
  "Runtime Compiler",
  "Mission Compiler",
  "Execution Compiler",
  "Knowledge IR",
  "Validation",
  "Knowledge Package Assembly",
  "Canonical Review",
  "Canonical Knowledge",
] as const;

export type KnowledgeManufacturingStage =
  (typeof knowledgeManufacturingStages)[number];

export type KnowledgeManufacturingStageOutcome =
  | "entered"
  | "processing"
  | "completed"
  | "not_applicable"
  | "awaiting_human_review"
  | "approved"
  | "published"
  | "blocked"
  | "failed";

export type KnowledgeManufacturingRunStatus =
  | "active"
  | "blocked"
  | "failed"
  | "completed";

export interface KnowledgeManufacturingStageEvent {
  stage:
    KnowledgeManufacturingStage;

  outcome:
    KnowledgeManufacturingStageOutcome;

  at:
    number;

  detail?:
    string;
}

export interface KnowledgeManufacturingRun {
  id:
    string;

  evidenceId:
    string;

  currentStage:
    KnowledgeManufacturingStage;

  status:
    KnowledgeManufacturingRunStatus;

  packageId?:
    string;

  canonicalKnowledgeIds:
    string[];

  stageHistory:
    KnowledgeManufacturingStageEvent[];

  createdAt:
    number;

  updatedAt:
    number;
}

export interface RouteKnowledgeManufacturingRunInput {
  targetStage:
    KnowledgeManufacturingStage;

  outcome:
    "completed";

  at?:
    number;

  detail?:
    string;
}

export interface CreateKnowledgeManufacturingRunInput {
  id:
    string;

  evidenceId:
    string;

  at?:
    number;
}

export interface AdvanceKnowledgeManufacturingRunInput {
  outcome:
    Exclude<
      KnowledgeManufacturingStageOutcome,
      "entered"
    >;

  at?:
    number;

  detail?:
    string;
}

function requireIdentifier(
  value:
    string,

  field:
    string,
): string {
  const normalized =
    value.trim();

  if (
    !normalized
  ) {
    throw new Error(
      `knowledge_manufacturing_${field}_required`,
    );
  }

  return normalized;
}

export function knowledgeManufacturingStageIndex(
  stage:
    KnowledgeManufacturingStage,
): number {
  return knowledgeManufacturingStages.indexOf(
    stage,
  );
}

export function nextKnowledgeManufacturingStage(
  stage:
    KnowledgeManufacturingStage,
): KnowledgeManufacturingStage | null {
  const index =
    knowledgeManufacturingStageIndex(
      stage,
    );

  if (
    index < 0
  ) {
    throw new Error(
      "knowledge_manufacturing_stage_invalid",
    );
  }

  return (
    knowledgeManufacturingStages[
      index + 1
    ] ??
    null
  );
}

export function routeKnowledgeManufacturingRun(
  run:
    KnowledgeManufacturingRun,

  input:
    RouteKnowledgeManufacturingRunInput,
): KnowledgeManufacturingRun {
  if (
    run.status !==
    "active"
  ) {
    throw new Error(
      "knowledge_manufacturing_run_not_active",
    );
  }

  const currentIndex =
    knowledgeManufacturingStageIndex(
      run.currentStage,
    );

  const targetIndex =
    knowledgeManufacturingStageIndex(
      input.targetStage,
    );

  if (
    currentIndex < 0 ||
    targetIndex < 0
  ) {
    throw new Error(
      "knowledge_manufacturing_stage_invalid",
    );
  }

  if (
    targetIndex <=
    currentIndex
  ) {
    throw new Error(
      "knowledge_manufacturing_route_not_forward",
    );
  }

  const at =
    input.at ??
    Date.now();

  if (
    at <
    run.updatedAt
  ) {
    throw new Error(
      "knowledge_manufacturing_event_time_regression",
    );
  }

  const history:
    KnowledgeManufacturingStageEvent[] = [
      ...run.stageHistory,
      {
        stage:
          run.currentStage,

        outcome:
          input.outcome,

        at,

        ...(
          input.detail
            ? {
                detail:
                  input.detail,
              }
            : {}
        ),
      },
    ];

  /*
   * A routed jump may cross compiler stations that do not
   * apply to this evidence.
   *
   * They remain auditable as not_applicable, but critically
   * they do NOT receive an "entered" event. The capsule never
   * occupies those stations.
   */
  for (
    let index =
      currentIndex + 1;

    index <
    targetIndex;

    index += 1
  ) {
    const skippedStage =
      knowledgeManufacturingStages[
        index
      ];

    if (
      !skippedStage.endsWith(
        "Compiler",
      )
    ) {
      throw new Error(
        `knowledge_manufacturing_illegal_route_skip:${skippedStage}`,
      );
    }

    history.push({
      stage:
        skippedStage,

      outcome:
        "not_applicable",

      at,

      detail:
        "Compiler station does not apply to this evidence route.",
    });
  }

  history.push({
    stage:
      input.targetStage,

    outcome:
      "entered",

    at,
  });

  return {
    ...run,

    currentStage:
      input.targetStage,

    stageHistory:
      history,

    updatedAt:
      at,
  };
}

export function createKnowledgeManufacturingRun(
  input:
    CreateKnowledgeManufacturingRunInput,
): KnowledgeManufacturingRun {
  const id =
    requireIdentifier(
      input.id,
      "run_id",
    );

  const evidenceId =
    requireIdentifier(
      input.evidenceId,
      "evidence_id",
    );

  const at =
    input.at ??
    Date.now();

  const currentStage:
    KnowledgeManufacturingStage =
      "Evidence Intake";

  return {
    id,

    evidenceId,

    currentStage,

    status:
      "active",

    canonicalKnowledgeIds:
      [],

    stageHistory: [
      {
        stage:
          currentStage,

        outcome:
          "entered",

        at,
      },
    ],

    createdAt:
      at,

    updatedAt:
      at,
  };
}

export function advanceKnowledgeManufacturingRun(
  run:
    KnowledgeManufacturingRun,

  input:
    AdvanceKnowledgeManufacturingRunInput,
): KnowledgeManufacturingRun {
  if (
    run.status !==
    "active"
  ) {
    throw new Error(
      "knowledge_manufacturing_run_not_active",
    );
  }

  const at =
    input.at ??
    Date.now();

  if (
    at <
    run.updatedAt
  ) {
    throw new Error(
      "knowledge_manufacturing_event_time_regression",
    );
  }

  const currentEvent:
    KnowledgeManufacturingStageEvent = {
      stage:
        run.currentStage,

      outcome:
        input.outcome,

      at,

      ...(
        input.detail
          ? {
              detail:
                input.detail,
            }
          : {}
      ),
    };

  if (
    input.outcome ===
    "blocked"
  ) {
    return {
      ...run,

      status:
        "blocked",

      stageHistory: [
        ...run.stageHistory,
        currentEvent,
      ],

      updatedAt:
        at,
    };
  }

  if (
    input.outcome ===
    "failed"
  ) {
    return {
      ...run,

      status:
        "failed",

      stageHistory: [
        ...run.stageHistory,
        currentEvent,
      ],

      updatedAt:
        at,
    };
  }

  /*
   * These outcomes describe the current station without
   * crossing its boundary.
   *
   * processing:
   *   work has begun but has not completed.
   *
   * awaiting_human_review:
   *   Canonical Review is intentionally blocked on human
   *   governance and must not auto-advance.
   */
  if (
    input.outcome ===
      "processing" ||
    input.outcome ===
      "awaiting_human_review"
  ) {
    return {
      ...run,

      stageHistory: [
        ...run.stageHistory,
        currentEvent,
      ],

      updatedAt:
        at,
    };
  }

  /*
   * The remaining successful terminal outcomes cross the
   * current station boundary:
   *
   * completed       ordinary processing boundary
   * not_applicable  station examined but no applicable
   *                 implementation exists for this evidence
   * approved        human Canonical Review approval
   * published       governed Canonical Knowledge publication
   */
  const nextStage =
    nextKnowledgeManufacturingStage(
      run.currentStage,
    );

  if (
    nextStage ===
    null
  ) {
    return {
      ...run,

      status:
        "completed",

      stageHistory: [
        ...run.stageHistory,
        currentEvent,
      ],

      updatedAt:
        at,
    };
  }

  return {
    ...run,

    currentStage:
      nextStage,

    stageHistory: [
      ...run.stageHistory,
      currentEvent,
      {
        stage:
          nextStage,

        outcome:
          "entered",

        at,
      },
    ],

    updatedAt:
      at,
  };
}

export function linkKnowledgeManufacturingPackage(
  run:
    KnowledgeManufacturingRun,

  packageId:
    string,

  at =
    Date.now(),
): KnowledgeManufacturingRun {
  const normalized =
    requireIdentifier(
      packageId,
      "package_id",
    );

  return {
    ...run,

    packageId:
      normalized,

    updatedAt:
      Math.max(
        run.updatedAt,
        at,
      ),
  };
}

export function linkKnowledgeManufacturingCanonicalItems(
  run:
    KnowledgeManufacturingRun,

  canonicalKnowledgeIds:
    readonly string[],

  at =
    Date.now(),
): KnowledgeManufacturingRun {
  const normalized =
    [
      ...new Set(
        canonicalKnowledgeIds
          .map(
            (id) =>
              id.trim(),
          )
          .filter(
            Boolean,
          ),
      ),
    ];

  return {
    ...run,

    canonicalKnowledgeIds:
      normalized,

    updatedAt:
      Math.max(
        run.updatedAt,
        at,
      ),
  };
}

function isKnowledgeManufacturingStage(
  value:
    unknown,
): value is KnowledgeManufacturingStage {
  return (
    typeof value ===
      "string" &&
    (
      knowledgeManufacturingStages as
        readonly string[]
    ).includes(
      value,
    )
  );
}

function normalizeStageHistory(
  value:
    unknown,
): KnowledgeManufacturingStageEvent[] {
  if (
    !Array.isArray(
      value,
    )
  ) {
    return [];
  }

  return value.filter(
    (
      event,
    ): event is KnowledgeManufacturingStageEvent => {
      if (
        !event ||
        typeof event !==
          "object"
      ) {
        return false;
      }

      const record =
        event as
          Record<
            string,
            unknown
          >;

      return (
        isKnowledgeManufacturingStage(
          record.stage,
        ) &&
        (
          record.outcome ===
            "entered" ||
          record.outcome ===
            "processing" ||
          record.outcome ===
            "completed" ||
          record.outcome ===
            "not_applicable" ||
          record.outcome ===
            "awaiting_human_review" ||
          record.outcome ===
            "approved" ||
          record.outcome ===
            "published" ||
          record.outcome ===
            "blocked" ||
          record.outcome ===
            "failed"
        ) &&
        typeof record.at ===
          "number"
      );
    },
  );
}

export function normalizeKnowledgeManufacturingRun(
  run:
    KnowledgeManufacturingRun,
): KnowledgeManufacturingRun {
  const stageHistory =
    normalizeStageHistory(
      run.stageHistory,
    );

  const currentStage =
    isKnowledgeManufacturingStage(
      run.currentStage,
    )
      ? run.currentStage
      : stageHistory.at(-1)
          ?.stage ??
        "Evidence Intake";

  const createdAt =
    typeof run.createdAt ===
      "number"
      ? run.createdAt
      : stageHistory[0]
          ?.at ??
        Date.now();

  const updatedAt =
    typeof run.updatedAt ===
      "number"
      ? run.updatedAt
      : stageHistory.at(-1)
          ?.at ??
        createdAt;

  const status:
    KnowledgeManufacturingRunStatus =
      run.status ===
        "blocked" ||
      run.status ===
        "failed" ||
      run.status ===
        "completed"
        ? run.status
        : "active";

  return {
    ...run,

    currentStage,

    status,

    canonicalKnowledgeIds:
      Array.isArray(
        run.canonicalKnowledgeIds,
      )
        ? [
            ...new Set(
              run.canonicalKnowledgeIds.filter(
                (
                  id,
                ): id is string =>
                  typeof id ===
                    "string" &&
                  id.trim().length >
                    0,
              ),
            ),
          ]
        : [],

    stageHistory,

    createdAt,

    updatedAt,
  };
}
