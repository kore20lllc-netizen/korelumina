import {
  createHash,
} from "node:crypto";

import type {
  OrganizationalMemoryRecord,
} from "../../knowledge/organizational-memory/OrganizationalMemoryRecord.js";

import type {
  KnowledgeManufacturingRun,
  KnowledgeManufacturingStageEvent,
} from "../manufacturing/index.js";

import type {
  GenesisCorpusReadModel,
} from "./GenesisCorpusReadModel.js";

export type GenesisKnowledgeLifecycleProjectionId =
  `genesis-knowledge-lifecycle:${string}`;

export type GenesisLifecycleCorrelationStatus =
  | "correlated"
  | "not-correlated"
  | "ambiguous";

export type GenesisLifecycleStageState =
  | "not-reached"
  | "entered"
  | "processing"
  | "completed"
  | "awaiting-human-review"
  | "approved"
  | "published"
  | "blocked"
  | "failed";

export interface GenesisLifecycleStageProjection {
  state:
    GenesisLifecycleStageState;

  events:
    readonly KnowledgeManufacturingStageEvent[];
}

export interface GenesisOrganizationalMemoryCorrelation {
  status:
    GenesisLifecycleCorrelationStatus;

  memoryRecordIds:
    readonly string[];

  adaptationValidated:
    boolean | null;
}

export interface GenesisKnowledgeLifecycleRecord {
  evidenceId:
    string;

  manufacturingCorrelation:
    GenesisLifecycleCorrelationStatus;

  manufacturingRunId:
    string | null;

  matchingManufacturingRunIds:
    readonly string[];

  manufacturingStatus:
    KnowledgeManufacturingRun["status"] |
    null;

  currentStage:
    KnowledgeManufacturingRun["currentStage"] |
    null;

  knowledgeIR:
    GenesisLifecycleStageProjection;

  validation:
    GenesisLifecycleStageProjection;

  packageAssembly:
    GenesisLifecycleStageProjection;

  canonicalReview:
    GenesisLifecycleStageProjection;

  canonicalKnowledge:
    GenesisLifecycleStageProjection;

  packageId:
    string | null;

  canonicalKnowledgeIds:
    readonly string[];

  organizationalMemory:
    readonly GenesisOrganizationalMemoryCorrelation[];

  educationalEligibility: {
    status:
      "not-evaluated";

    eligible:
      null;
  };
}

export interface GenesisKnowledgeLifecycleSummary {
  admittedEvidence:
    number;

  manufacturingCorrelated:
    number;

  manufacturingAmbiguous:
    number;

  manufacturingUncorrelated:
    number;

  knowledgeIRReached:
    number;

  validated:
    number;

  packaged:
    number;

  awaitingCanonicalReview:
    number;

  canonical:
    number;

  memoryCorrelatedCanonicalItems:
    number;

  memoryAdaptationValidated:
    number;

  educationalEligibilityEvaluated:
    0;
}

export interface GenesisKnowledgeLifecycleProjection {
  projectionId:
    GenesisKnowledgeLifecycleProjectionId;

  corpusProjectionId:
    GenesisCorpusReadModel["projectionId"];

  records:
    readonly GenesisKnowledgeLifecycleRecord[];

  summary:
    GenesisKnowledgeLifecycleSummary;
}

export interface BuildGenesisKnowledgeLifecycleCorrelationInput {
  corpus:
    GenesisCorpusReadModel;

  manufacturingRuns:
    readonly KnowledgeManufacturingRun[];

  organizationalMemory:
    readonly OrganizationalMemoryRecord[];
}

function stableNormalize(
  value:
    unknown,
): unknown {
  if (
    Array.isArray(
      value,
    )
  ) {
    return value.map(
      stableNormalize,
    );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    const record =
      value as Record<
        string,
        unknown
      >;

    return Object.fromEntries(
      Object.keys(
        record,
      )
        .sort()
        .map(
          (
            key,
          ) => [
            key,
            stableNormalize(
              record[key],
            ),
          ],
        ),
    );
  }

  return value;
}

function hash(
  value:
    unknown,
): string {
  return createHash(
    "sha256",
  )
    .update(
      JSON.stringify(
        stableNormalize(
          value,
        ),
      ),
      "utf8",
    )
    .digest(
      "hex",
    );
}

function sortedUnique(
  values:
    readonly string[],
): readonly string[] {
  return [
    ...new Set(
      values,
    ),
  ].sort();
}

function stageStateFromOutcome(
  outcome:
    KnowledgeManufacturingStageEvent["outcome"],
): GenesisLifecycleStageState {
  switch (
    outcome
  ) {
    case "entered":
      return "entered";

    case "processing":
      return "processing";

    case "completed":
    case "not_applicable":
      return "completed";

    case "awaiting_human_review":
      return "awaiting-human-review";

    case "approved":
      return "approved";

    case "published":
      return "published";

    case "blocked":
      return "blocked";

    case "failed":
      return "failed";
  }
}

function stageProjection(
  run:
    KnowledgeManufacturingRun |
    undefined,

  stage:
    KnowledgeManufacturingStageEvent["stage"],
): GenesisLifecycleStageProjection {
  if (
    !run
  ) {
    return {
      state:
        "not-reached",

      events:
        [],
    };
  }

  const events =
    run.stageHistory
      .filter(
        (
          event,
        ) =>
          event.stage ===
          stage,
      )
      .slice()
      .sort(
        (
          left,
          right,
        ) =>
          left.at -
          right.at,
      );

  if (
    run.currentStage ===
      stage &&
    events.length ===
      0
  ) {
    return {
      state:
        run.status ===
          "failed"
          ? "failed"
          : run.status ===
              "blocked"
            ? "blocked"
            : "entered",

      events,
    };
  }

  const latest =
    events[
      events.length -
        1
    ];

  if (
    !latest
  ) {
    return {
      state:
        "not-reached",

      events,
    };
  }

  return {
    state:
      stageStateFromOutcome(
        latest.outcome,
      ),

    events,
  };
}

function organizationalMemoryFor(
  canonicalKnowledgeId:
    string,

  memory:
    readonly OrganizationalMemoryRecord[],
): GenesisOrganizationalMemoryCorrelation {
  const matches =
    memory
      .filter(
        (
          record,
        ) =>
          record.governance
            ?.canonicalItemId ===
          canonicalKnowledgeId,
      )
      .sort(
        (
          left,
          right,
        ) =>
          left.id.localeCompare(
            right.id,
          ),
      );

  if (
    matches.length ===
      0
  ) {
    return {
      status:
        "not-correlated",

      memoryRecordIds:
        [],

      adaptationValidated:
        null,
    };
  }

  const validated =
    matches.every(
      (
        record,
      ) =>
        record.governance
          ?.trust
          .adaptationValidated ===
        true,
    );

  return {
    status:
      matches.length ===
        1
        ? "correlated"
        : "ambiguous",

    memoryRecordIds:
      matches.map(
        (
          record,
        ) =>
          record.id,
      ),

    adaptationValidated:
      validated,
  };
}

function recordFor(
  evidenceId:
    string,

  manufacturingRuns:
    readonly KnowledgeManufacturingRun[],

  memory:
    readonly OrganizationalMemoryRecord[],
): GenesisKnowledgeLifecycleRecord {
  const matches =
    manufacturingRuns
      .filter(
        (
          run,
        ) =>
          run.evidenceId ===
          evidenceId,
      )
      .slice()
      .sort(
        (
          left,
          right,
        ) =>
          left.id.localeCompare(
            right.id,
          ),
      );

  const ambiguous =
    matches.length >
    1;

  const run =
    matches.length ===
      1
      ? matches[0]
      : undefined;

  const canonicalKnowledgeIds =
    run
      ? sortedUnique(
          run
            .canonicalKnowledgeIds,
        )
      : [];

  return {
    evidenceId,

    manufacturingCorrelation:
      ambiguous
        ? "ambiguous"
        : run
          ? "correlated"
          : "not-correlated",

    manufacturingRunId:
      run?.id ??
      null,

    matchingManufacturingRunIds:
      matches.map(
        (
          item,
        ) =>
          item.id,
      ),

    manufacturingStatus:
      run?.status ??
      null,

    currentStage:
      run?.currentStage ??
      null,

    knowledgeIR:
      stageProjection(
        run,
        "Knowledge IR",
      ),

    validation:
      stageProjection(
        run,
        "Validation",
      ),

    packageAssembly:
      stageProjection(
        run,
        "Knowledge Package Assembly",
      ),

    canonicalReview:
      stageProjection(
        run,
        "Canonical Review",
      ),

    canonicalKnowledge:
      stageProjection(
        run,
        "Canonical Knowledge",
      ),

    packageId:
      run?.packageId ??
      null,

    canonicalKnowledgeIds,

    organizationalMemory:
      canonicalKnowledgeIds
        .map(
          (
            canonicalKnowledgeId,
          ) =>
            organizationalMemoryFor(
              canonicalKnowledgeId,
              memory,
            ),
        ),

    /*
     * CA-005 educational eligibility remains a later
     * governed projection.
     *
     * Memory correlation or adaptation validation alone
     * does not establish curriculum eligibility.
     */
    educationalEligibility: {
      status:
        "not-evaluated",

      eligible:
        null,
    },
  };
}

export function buildGenesisKnowledgeLifecycleCorrelation(
  input:
    BuildGenesisKnowledgeLifecycleCorrelationInput,
): GenesisKnowledgeLifecycleProjection {
  const admittedEvidenceIds =
    sortedUnique(
      input.corpus.replays
        .flatMap(
          (
            replay,
          ) =>
            replay
              .admittedEvidenceIds,
        ),
    );

  const records =
    admittedEvidenceIds
      .map(
        (
          evidenceId,
        ) =>
          recordFor(
            evidenceId,
            input.manufacturingRuns,
            input.organizationalMemory,
          ),
      )
      .sort(
        (
          left,
          right,
        ) =>
          left.evidenceId
            .localeCompare(
              right.evidenceId,
            ),
      );

  const summary:
    GenesisKnowledgeLifecycleSummary = {
      admittedEvidence:
        records.length,

      manufacturingCorrelated:
        records.filter(
          (
            record,
          ) =>
            record
              .manufacturingCorrelation ===
            "correlated",
        ).length,

      manufacturingAmbiguous:
        records.filter(
          (
            record,
          ) =>
            record
              .manufacturingCorrelation ===
            "ambiguous",
        ).length,

      manufacturingUncorrelated:
        records.filter(
          (
            record,
          ) =>
            record
              .manufacturingCorrelation ===
            "not-correlated",
        ).length,

      knowledgeIRReached:
        records.filter(
          (
            record,
          ) =>
            record
              .knowledgeIR
              .state !==
            "not-reached",
        ).length,

      validated:
        records.filter(
          (
            record,
          ) =>
            [
              "completed",
              "approved",
              "published",
            ].includes(
              record
                .validation
                .state,
            ),
        ).length,

      packaged:
        records.filter(
          (
            record,
          ) =>
            record.packageId !==
            null,
        ).length,

      awaitingCanonicalReview:
        records.filter(
          (
            record,
          ) =>
            record
              .canonicalReview
              .state ===
            "awaiting-human-review",
        ).length,

      canonical:
        records.filter(
          (
            record,
          ) =>
            record
              .canonicalKnowledgeIds
              .length >
            0,
        ).length,

      memoryCorrelatedCanonicalItems:
        records
          .flatMap(
            (
              record,
            ) =>
              record
                .organizationalMemory,
          )
          .filter(
            (
              correlation,
            ) =>
              correlation.status ===
              "correlated",
          )
          .length,

      memoryAdaptationValidated:
        records
          .flatMap(
            (
              record,
            ) =>
              record
                .organizationalMemory,
          )
          .filter(
            (
              correlation,
            ) =>
              correlation
                .adaptationValidated ===
              true,
          )
          .length,

      educationalEligibilityEvaluated:
        0,
    };

  const projectionId =
    `genesis-knowledge-lifecycle:${hash({
      corpusProjectionId:
        input.corpus
          .projectionId,

      records,

      summary,
    })}` as GenesisKnowledgeLifecycleProjectionId;

  return {
    projectionId,

    corpusProjectionId:
      input.corpus
        .projectionId,

    records,

    summary,
  };
}
