import {
  createHash,
} from "node:crypto";

import {
  composeHistoricalConversationIntoDayZeroCoverage,
  measureDayZeroEducationalCoverage,
} from "./DayZeroEducationalCoverage.js";

import type {
  DayZeroEducationalCoverage,
  DayZeroEducationalModuleCoverage,
} from "./DayZeroEducationalCoverage.js";

import type {
  EducationalArtifactProjection,
} from "./projection/index.js";

import type {
  EducationalCorpusRuntimeProjection,
} from "./EducationalCorpusRuntimeService.js";


export type EducationalCorpusCertificationCandidateInput =
  Omit<
    EducationalCorpusRuntimeProjection,
    "certificationCandidate"
  >;


export type EducationalCorpusCertificationCandidateId =
  `educational-corpus-certification-candidate:${string}`;


export type EducationalCorpusCertificationCandidateState =
  | "READY"
  | "INCOMPLETE"
  | "BLOCKED";


export interface EducationalCorpusCertificationException {
  code:
    string;

  category:
    | "corpus-state"
    | "authority-review"
    | "curriculum-coverage"
    | "provenance";

  subjectId:
    string | null;
}


export interface EducationalCorpusCertificationCandidate {
  candidateId:
    EducationalCorpusCertificationCandidateId;

  state:
    EducationalCorpusCertificationCandidateState;

  corpusId:
    string | null;

  sourceContractId:
    string | null;

  dayZeroCertificationId:
    string | null;

  coverage: {
    constitutionalLiteracy:
      DayZeroEducationalModuleCoverage;

    dayZero:
      DayZeroEducationalCoverage;
  };

  summary: {
    sourceArtifacts:
      number;

    curriculumItems:
      number;

    unresolvedItems:
      number;

    excludedItems:
      number;

    blockedItems:
      number;

    exceptions:
      number;
  };

  excludedMaterial:
    readonly {
      artifactId:
        string;

      decision:
        "REQUIRES_AUTHORITY_REVIEW" |
        "EXCLUDED" |
        "BLOCKED";

      reasons:
        readonly string[];
    }[];

  exceptions:
    readonly EducationalCorpusCertificationException[];

  approval: {
    singleHumanApprovalRequired:
      true;

    perArtifactApprovalRequired:
      false;

    available:
      boolean;

    reason:
      string;
  };

  /*
   * Certification candidate only.
   */
  educationalCorpusCertified:
    false;

  initialCompetencyCertified:
    false;

  chiefAgentActivationAuthorized:
    false;
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
          key => [
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


function compareException(
  left:
    EducationalCorpusCertificationException,

  right:
    EducationalCorpusCertificationException,
): number {
  return left.category.localeCompare(
    right.category,
  ) ||
  left.code.localeCompare(
    right.code,
  ) ||
  (
    left.subjectId ??
    ""
  ).localeCompare(
    right.subjectId ??
    "",
  );
}


export function buildEducationalCorpusCertificationCandidate(
  input: {
    runtime:
      EducationalCorpusCertificationCandidateInput;

    artifacts:
      readonly EducationalArtifactProjection[];
  },
): EducationalCorpusCertificationCandidate {
  const exceptions:
    EducationalCorpusCertificationException[] =
      [];

  const persisted =
    input.runtime
      .persistedCorpus;

  const current =
    input.runtime
      .currentCorpus;

  if (
    input.runtime.state ===
      "BLOCKED"
  ) {
    exceptions.push({
      code:
        "educational-corpus-runtime-blocked",

      category:
        "corpus-state",

      subjectId:
        null,
    });
  }

  if (
    input.runtime.state !==
      "CURRENT"
  ) {
    exceptions.push({
      code:
        `educational-corpus-not-current:${input.runtime.state.toLowerCase()}`,

      category:
        "corpus-state",

      subjectId:
        persisted
          ?.corpusId ??
        null,
    });
  }

  if (
    !persisted
  ) {
    exceptions.push({
      code:
        "persisted-educational-corpus-required",

      category:
        "corpus-state",

      subjectId:
        null,
    });
  }

  if (
    !current
  ) {
    exceptions.push({
      code:
        "current-educational-corpus-unavailable",

      category:
        "corpus-state",

      subjectId:
        null,
    });
  }

  if (
    persisted &&
    current &&
    persisted.corpusId !==
      current.corpusId
  ) {
    exceptions.push({
      code:
        "persisted-educational-corpus-does-not-match-current",

      category:
        "provenance",

      subjectId:
        persisted.corpusId,
    });
  }

  for (
    const artifactId
    of input.runtime
      .unresolvedArtifactIds
  ) {
    exceptions.push({
      code:
        "educational-source-authority-unresolved",

      category:
        "authority-review",

      subjectId:
        artifactId,
    });
  }

  const persistedArtifactIds =
    new Set(
      persisted
        ?.items
        .map(
          item =>
            item.artifactId,
        ) ??
      [],
    );

  const curriculumArtifacts =
    input.artifacts
      .filter(
        artifact =>
          persistedArtifactIds.has(
            artifact.id,
          ),
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

  const currentDayZeroCoverage =
    measureDayZeroEducationalCoverage(
      curriculumArtifacts,
    );

  const dayZeroCoverage =
    composeHistoricalConversationIntoDayZeroCoverage(
      currentDayZeroCoverage,

      input.runtime
        .historicalConversationCoverage ??
        null,
    );

  const constitutionalCoverage =
    dayZeroCoverage
      .modules[
        "constitutional-literacy"
      ];

  for (
    const moduleId
    of dayZeroCoverage
      .requiredModules
  ) {
    const moduleCoverage =
      dayZeroCoverage
        .modules[
          moduleId
        ];

    for (
      const requirementId
      of moduleCoverage
        .missingRequirements
    ) {
      exceptions.push({
        code:
          `required-day-zero-curriculum-missing:${moduleId}`,

        category:
          "curriculum-coverage",

        subjectId:
          requirementId,
      });
    }
  }

  const deduplicated =
    [
      ...new Map(
        exceptions.map(
          item => [
            JSON.stringify(
              item,
            ),
            item,
          ],
        ),
      ).values(),
    ].sort(
      compareException,
    );

  const blocked =
    input.runtime.state ===
      "BLOCKED";

  const state:
    EducationalCorpusCertificationCandidateState =
      blocked
        ? "BLOCKED"
        : deduplicated.length >
            0
          ? "INCOMPLETE"
          : "READY";

  const summary = {
    sourceArtifacts:
      persisted
        ?.summary
        .sourceArtifacts ??
      0,

    curriculumItems:
      persisted
        ?.summary
        .curriculumItems ??
      0,

    unresolvedItems:
      persisted
        ?.summary
        .unresolvedItems ??
      0,

    excludedItems:
      persisted
        ?.summary
        .excludedItems ??
      0,

    blockedItems:
      persisted
        ?.summary
        .blockedItems ??
      0,

    exceptions:
      deduplicated.length,
  };

  const excludedMaterial =
    [
      ...(
        persisted
          ?.excluded ??
        []
      ),
    ]
      .map(
        item => ({
          artifactId:
            item.artifactId,

          decision:
            item.decision,

          reasons: [
            ...item.reasons,
          ].sort(),
        }),
      )
      .sort(
        (
          left,
          right,
        ) =>
          left.decision.localeCompare(
            right.decision,
          ) ||
          left.artifactId.localeCompare(
            right.artifactId,
          ),
      );

  const approvalAvailable =
    state ===
      "READY";

  const approvalReason =
    state ===
      "READY"
      ? "The persisted Educational Corpus is current, every required Day-0 curriculum module is complete, and no unresolved certification exceptions remain. One corpus-level human approval may be issued."
      : state ===
          "BLOCKED"
        ? "Educational Corpus certification is blocked by an invalid upstream authority state."
        : "Resolve the surfaced Educational Corpus exceptions before corpus-level approval is available.";

  const candidateId =
    `educational-corpus-certification-candidate:${hash({
      state,

      corpusId:
        persisted
          ?.corpusId ??
        null,

      sourceContractId:
        persisted
          ?.sourceContractId ??
        null,

      dayZeroCertificationId:
        persisted
          ?.dayZeroCertificationId ??
        null,

      dayZeroCoverage,

      summary,

      excludedMaterial,

      exceptions:
        deduplicated,
    })}` as EducationalCorpusCertificationCandidateId;

  return {
    candidateId,

    state,

    corpusId:
      persisted
        ?.corpusId ??
      null,

    sourceContractId:
      persisted
        ?.sourceContractId ??
      null,

    dayZeroCertificationId:
      persisted
        ?.dayZeroCertificationId ??
      null,

    coverage: {
      constitutionalLiteracy:
        constitutionalCoverage,

      dayZero:
        dayZeroCoverage,
    },

    summary,

    excludedMaterial,

    exceptions:
      deduplicated,

    approval: {
      singleHumanApprovalRequired:
        true,

      perArtifactApprovalRequired:
        false,

      available:
        approvalAvailable,

      reason:
        approvalReason,
    },

    educationalCorpusCertified:
      false,

    initialCompetencyCertified:
      false,

    chiefAgentActivationAuthorized:
      false,
  };
}
