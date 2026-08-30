import {
  coverageRequirementsForModule,
  measureEducationalCoverage,
} from "./measurement/index.js";

import type {
  EducationalArtifactProjection,
} from "./projection/index.js";

import type {
  HistoricalConversationEducationalCoverageResult,
} from "./HistoricalConversationEducationalCoverage.js";


export const REQUIRED_DAY_ZERO_EDUCATIONAL_MODULE_IDS = [
  "constitutional-literacy",
  "knowledge-governance",
  "operational-boundaries",
  "conversation-curriculum",
  "business-domain-literacy",
] as const;


export type RequiredDayZeroEducationalModuleId =
  typeof REQUIRED_DAY_ZERO_EDUCATIONAL_MODULE_IDS[number];


export interface DayZeroEducationalModuleCoverage {
  satisfiedRequirements:
    readonly string[];

  missingRequirements:
    readonly string[];

  satisfiedCount:
    number;

  requirementCount:
    number;

  completion:
    number;

  measurementVersion:
    "education-coverage-v1";
}


export interface DayZeroEducationalCoverage {
  requiredModules:
    readonly RequiredDayZeroEducationalModuleId[];

  completeModules:
    readonly RequiredDayZeroEducationalModuleId[];

  modules:
    Readonly<
      Record<
        RequiredDayZeroEducationalModuleId,
        DayZeroEducationalModuleCoverage
      >
    >;

  satisfiedRequirements:
    readonly string[];

  missingRequirements:
    readonly string[];

  satisfiedCount:
    number;

  requirementCount:
    number;

  completion:
    number;

  measurementVersion:
    "education-coverage-v1";
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


export function measureDayZeroEducationalCoverage(
  artifacts:
    readonly EducationalArtifactProjection[],
): DayZeroEducationalCoverage {
  const entries =
    REQUIRED_DAY_ZERO_EDUCATIONAL_MODULE_IDS.map(
      moduleId => {
        const requirements =
          coverageRequirementsForModule(
            moduleId,
          );

        if (
          requirements.length ===
            0
        ) {
          throw new Error(
            `day_zero_education_required_module_requirements_missing:${moduleId}`,
          );
        }

        const measured =
          measureEducationalCoverage(
            artifacts,
            requirements,
          );

        const coverage:
          DayZeroEducationalModuleCoverage = {
            satisfiedRequirements:
              sortedUnique(
                measured.satisfied,
              ),

            missingRequirements:
              sortedUnique(
                measured.missing,
              ),

            satisfiedCount:
              measured.satisfiedCount,

            requirementCount:
              measured.requirementCount,

            completion:
              measured.completion,

            measurementVersion:
              measured.measurementVersion,
          };

        return [
          moduleId,
          coverage,
        ] as const;
      },
    );

  const modules =
    Object.fromEntries(
      entries,
    ) as Record<
      RequiredDayZeroEducationalModuleId,
      DayZeroEducationalModuleCoverage
    >;

  const completeModules =
    REQUIRED_DAY_ZERO_EDUCATIONAL_MODULE_IDS.filter(
      moduleId => {
        const coverage =
          modules[
            moduleId
          ];

        return (
          coverage.requirementCount >
            0 &&
          coverage.completion ===
            100 &&
          coverage
            .missingRequirements
            .length ===
            0
        );
      },
    );

  const satisfiedCount =
    REQUIRED_DAY_ZERO_EDUCATIONAL_MODULE_IDS.reduce(
      (
        total,
        moduleId,
      ) =>
        total +
        modules[
          moduleId
        ].satisfiedCount,
      0,
    );

  const requirementCount =
    REQUIRED_DAY_ZERO_EDUCATIONAL_MODULE_IDS.reduce(
      (
        total,
        moduleId,
      ) =>
        total +
        modules[
          moduleId
        ].requirementCount,
      0,
    );

  return {
    requiredModules: [
      ...REQUIRED_DAY_ZERO_EDUCATIONAL_MODULE_IDS,
    ],

    completeModules: [
      ...completeModules,
    ],

    modules,

    satisfiedRequirements:
      sortedUnique(
        REQUIRED_DAY_ZERO_EDUCATIONAL_MODULE_IDS.flatMap(
          moduleId =>
            modules[
              moduleId
            ].satisfiedRequirements,
        ),
      ),

    missingRequirements:
      sortedUnique(
        REQUIRED_DAY_ZERO_EDUCATIONAL_MODULE_IDS.flatMap(
          moduleId =>
            modules[
              moduleId
            ].missingRequirements,
        ),
      ),

    satisfiedCount,

    requirementCount,

    completion:
      requirementCount ===
        0
        ? 0
        : Math.round(
            (
              satisfiedCount /
              requirementCount
            ) *
              100,
          ),

    measurementVersion:
      "education-coverage-v1",
  };
}


export function composeHistoricalConversationIntoDayZeroCoverage(
  current:
    DayZeroEducationalCoverage,

  historical:
    HistoricalConversationEducationalCoverageResult |
    null = null,
): DayZeroEducationalCoverage {
  if (
    historical ===
    null
  ) {
    return current;
  }

  if (
    historical.moduleId !==
      "conversation-curriculum"
  ) {
    throw new Error(
      "day_zero_historical_conversation_module_invalid",
    );
  }

  if (
    historical.governingAuthority !==
      false
  ) {
    throw new Error(
      "day_zero_historical_conversation_authority_invalid",
    );
  }

  const governedRequirementIds =
    coverageRequirementsForModule(
      "conversation-curriculum",
    )
      .map(
        requirement =>
          requirement.id,
      )
      .sort();

  if (
    governedRequirementIds.length ===
      0
  ) {
    throw new Error(
      "day_zero_historical_conversation_requirements_missing",
    );
  }

  const governedRequirementIdSet =
    new Set(
      governedRequirementIds,
    );

  for (
    const requirementId
    of historical.satisfiedRequirements
  ) {
    if (
      !governedRequirementIdSet.has(
        requirementId,
      )
    ) {
      throw new Error(
        `day_zero_historical_conversation_requirement_unknown:${requirementId}`,
      );
    }
  }

  const currentConversation =
    current.modules[
      "conversation-curriculum"
    ];

  const satisfiedRequirements =
    sortedUnique([
      ...currentConversation
        .satisfiedRequirements,

      ...historical
        .satisfiedRequirements,
    ])
      .filter(
        requirementId =>
          governedRequirementIdSet.has(
            requirementId,
          ),
      );

  const satisfiedSet =
    new Set(
      satisfiedRequirements,
    );

  const missingRequirements =
    governedRequirementIds.filter(
      requirementId =>
        !satisfiedSet.has(
          requirementId,
        ),
    );

  const satisfiedCount =
    satisfiedRequirements.length;

  const requirementCount =
    governedRequirementIds.length;

  const conversationCoverage:
    DayZeroEducationalModuleCoverage = {
      satisfiedRequirements,

      missingRequirements,

      satisfiedCount,

      requirementCount,

      completion:
        requirementCount ===
          0
          ? 0
          : Math.round(
              (
                satisfiedCount /
                requirementCount
              ) *
                100,
            ),

      measurementVersion:
        currentConversation
          .measurementVersion,
    };

  /*
   * Authority lanes remain separate.
   *
   * Only resolved educational requirement satisfaction is composed.
   * Historical Evidence itself never enters EducationalArtifactProjection.
   */
  const modules:
    Record<
      RequiredDayZeroEducationalModuleId,
      DayZeroEducationalModuleCoverage
    > = {
      ...current.modules,

      "conversation-curriculum":
        conversationCoverage,
    };

  const completeModules =
    REQUIRED_DAY_ZERO_EDUCATIONAL_MODULE_IDS
      .filter(
        moduleId => {
          const coverage =
            modules[
              moduleId
            ];

          return (
            coverage.requirementCount >
              0 &&
            coverage.completion ===
              100 &&
            coverage
              .missingRequirements
              .length ===
              0
          );
        },
      );

  const aggregateSatisfied =
    sortedUnique(
      REQUIRED_DAY_ZERO_EDUCATIONAL_MODULE_IDS
        .flatMap(
          moduleId =>
            modules[
              moduleId
            ].satisfiedRequirements,
        ),
    );

  const aggregateMissing =
    sortedUnique(
      REQUIRED_DAY_ZERO_EDUCATIONAL_MODULE_IDS
        .flatMap(
          moduleId =>
            modules[
              moduleId
            ].missingRequirements,
        ),
    );

  const aggregateSatisfiedCount =
    REQUIRED_DAY_ZERO_EDUCATIONAL_MODULE_IDS
      .reduce(
        (
          total,
          moduleId,
        ) =>
          total +
          modules[
            moduleId
          ].satisfiedCount,
        0,
      );

  const aggregateRequirementCount =
    REQUIRED_DAY_ZERO_EDUCATIONAL_MODULE_IDS
      .reduce(
        (
          total,
          moduleId,
        ) =>
          total +
          modules[
            moduleId
          ].requirementCount,
        0,
      );

  return {
    requiredModules: [
      ...REQUIRED_DAY_ZERO_EDUCATIONAL_MODULE_IDS,
    ],

    completeModules: [
      ...completeModules,
    ],

    modules,

    satisfiedRequirements:
      aggregateSatisfied,

    missingRequirements:
      aggregateMissing,

    satisfiedCount:
      aggregateSatisfiedCount,

    requirementCount:
      aggregateRequirementCount,

    completion:
      aggregateRequirementCount ===
        0
        ? 0
        : Math.round(
            (
              aggregateSatisfiedCount /
              aggregateRequirementCount
            ) *
              100,
          ),

    measurementVersion:
      current.measurementVersion,
  };
}
