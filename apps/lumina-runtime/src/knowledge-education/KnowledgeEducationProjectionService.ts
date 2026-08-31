import type {
  DayZeroEducationalCoverage,
} from "./DayZeroEducationalCoverage.js";

import type {
  CanonicalKnowledgeItem,
} from "../canonical-knowledge/index.js";

import {
  projectEducationalArtifact,
  projectEducationalTimeline,
} from "./projection/index.js";

import type {
  EducationalArtifactProjection,
  EducationalTimelineProjection,
} from "./projection/index.js";

import {
  canonicalEducationUpdatedAt,
} from "./normalization/index.js";

import {
  isEducationallyAdmissible,
} from "./admission/index.js";

import {
  certifiedEducationalCompetencies,
  certifiedEducationalModules,
} from "./CertifiedEducationalCurriculum.js";

import {
  coverageRequirementsForModule,
  educationalStatusFromCoverage,
  measureEducationalCoverage,
} from "./measurement/index.js";

import type {
  EducationalRuntimeCompetency,
  EducationalRuntimeModule,
} from "./CertifiedEducationalCurriculum.js";

export type EducationalProjectionState =
  | "empty"
  | "partial"
  | "success";

export interface KnowledgeEducationSnapshot {
  state:
    EducationalProjectionState;

  artifacts:
    EducationalArtifactProjection[];

  modules:
    EducationalRuntimeModule[];

  competencies:
    EducationalRuntimeCompetency[];

  timeline:
    EducationalTimelineProjection[];

  generatedAt:
    number;

  source:
    "canonical-knowledge";
}

export interface CanonicalKnowledgeProjectionStore {
  list():
    CanonicalKnowledgeItem[];
}


function projectRuntimeCompetencies(
  artifacts:
    readonly EducationalArtifactProjection[],
): EducationalRuntimeCompetency[] {
  const missionCurriculumPresent =
    artifacts.some(
      artifact =>
        artifact.kind ===
          "mission" ||
        (
          artifact.title ===
            "Mission Ownership" &&
          artifact.educationalStatus ===
            "completed" &&
          artifact.approvalState
            .trim()
            .toLowerCase() ===
            "approved"
        ),
    );

  return certifiedEducationalCompetencies.map(
    competency => {
      if (
        competency.id !==
          "mission-boundaries" ||
        missionCurriculumPresent
      ) {
        return {
          ...competency,
        };
      }

      return {
        ...competency,

        status:
          "not-started",

        evidence:
          "Mission curriculum is not present in the current Educational Corpus.",
      };
    },
  );
}

export class KnowledgeEducationProjectionService {
  constructor(
    private readonly canonicalStore:
      CanonicalKnowledgeProjectionStore,
  ) {}

  snapshot(
    dayZeroCoverage:
      DayZeroEducationalCoverage |
      null = null,
  ):
    KnowledgeEducationSnapshot {
    const canonical =
      this.canonicalStore
        .list()
        .filter(
          isEducationallyAdmissible,
        )
        .slice()
        .sort(
          (
            left,
            right,
          ) =>
            canonicalEducationUpdatedAt(
              right,
            ) -
            canonicalEducationUpdatedAt(
              left,
            ),
        );

    const artifacts:
      EducationalArtifactProjection[] =
        canonical.map(
          projectEducationalArtifact,
        );

    const timeline:
      EducationalTimelineProjection[] =
        projectEducationalTimeline(
          canonical,
        );

    return {
      /*
       * The certified Education UI owns the composition contract.
       *
       * Curriculum modules and competency objectives exist even
       * when the canonical corpus is temporarily empty. Therefore
       * an empty canonical corpus is a partial educational state,
       * not an empty workspace.
       *
       * This keeps Educational Progress, Competency Posture and
       * Activation Readiness mounted while accurately representing
       * the missing canonical-artifact slice.
       */
      state:
        "success",

      artifacts,

      modules:
        certifiedEducationalModules.map(
          (module) => {
            const resolvedCoverage =
              dayZeroCoverage
                ? (() => {
                    switch (
                      module.id
                    ) {
                      case "constitutional-literacy":
                      case "knowledge-governance":
                      case "operational-boundaries":
                      case "conversation-curriculum":
                      case "business-domain-literacy":
                        return dayZeroCoverage
                          .modules[
                            module.id
                          ];

                      default:
                        return undefined;
                    }
                  })()
                : undefined;

            const currentCoverage =
              resolvedCoverage
                ? null
                : measureEducationalCoverage(
                    artifacts,
                    coverageRequirementsForModule(
                      module.id,
                    ),
                  );

            const completion =
              resolvedCoverage
                ?.completion ??
              currentCoverage
                ?.completion ??
              0;

            return {
              ...module,

              status:
                educationalStatusFromCoverage(
                  completion,
                  module.conflict,
                ),

              completion,

              coverage: {
                satisfiedRequirements:
                  resolvedCoverage
                    ? [
                        ...resolvedCoverage
                          .satisfiedRequirements,
                      ]
                    : [
                        ...(currentCoverage
                          ?.satisfied ??
                          []),
                      ],

                missingRequirements:
                  resolvedCoverage
                    ? [
                        ...resolvedCoverage
                          .missingRequirements,
                      ]
                    : [
                        ...(currentCoverage
                          ?.missing ??
                          []),
                      ],

                satisfiedCount:
                  resolvedCoverage
                    ?.satisfiedCount ??
                  currentCoverage
                    ?.satisfiedCount ??
                  0,

                requirementCount:
                  resolvedCoverage
                    ?.requirementCount ??
                  currentCoverage
                    ?.requirementCount ??
                  0,

                /*
                 * KnowledgeEducationSnapshot exposes the certified UI
                 * projection contract version, not the underlying Day-0
                 * measurement engine version.
                 */
                measurementVersion:
                  "education-coverage-v1",
              },

              dependencyIds: [
                ...module.dependencyIds,
              ],

              competencyObjectives: [
                ...module.competencyObjectives,
              ],
            };
          },
        ),

      competencies:
        projectRuntimeCompetencies(
          artifacts,
        ),

      timeline,

      generatedAt:
        Date.now(),

      source:
        "canonical-knowledge",
    };
  }
}
