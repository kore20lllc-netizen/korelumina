import {
  certifiedEducationalDashboardContract,
} from "./contracts/CertifiedEducationalDashboardContract";

import type {
  CompetencyObjective,
  EducationalArtifact,
  EducationalModule,
  EducationalTimelineEvent,
  EducationalUiState,
} from "../model";


export interface EducationalDashboardData {
  state:
    EducationalUiState;

  artifacts:
    EducationalArtifact[];

  modules:
    EducationalModule[];

  competencies:
    CompetencyObjective[];

  timeline:
    EducationalTimelineEvent[];
}


/*
 * Certified data preserves Education presentation topology only.
 *
 * It must never manufacture live progress.
 *
 * Until Runtime measurement arrives, module progress is deliberately
 * neutral rather than falling back to historical modeled percentages.
 */
export function certifiedBaseline():
EducationalDashboardData {
  return {
    state:
      certifiedEducationalDashboardContract.state,

    artifacts:
      certifiedEducationalDashboardContract.artifacts,

    modules:
      certifiedEducationalDashboardContract.modules.map(
        module => ({
          ...module,

          status:
            module.conflict
              ? "blocked"
              : "not-started",

          completion:
            0,
        }),
      ),

    competencies:
      certifiedEducationalDashboardContract.competencies,

    timeline:
      certifiedEducationalDashboardContract.timeline,
  };
}


function mergeRuntimeModules(
  baseline:
    EducationalModule[],

  runtime:
    EducationalModule[],
): EducationalModule[] {
  const runtimeById =
    new Map(
      runtime.map(
        module => [
          module.id,
          module,
        ],
      ),
    );

  return baseline.map(
    certifiedModule => {
      const live =
        runtimeById.get(
          certifiedModule.id,
        );

      if (
        !live
      ) {
        return certifiedModule;
      }

      /*
       * UI topology remains certified.
       *
       * Runtime owns live measurement state.
       */
      return {
        ...certifiedModule,

        status:
          live.status,

        completion:
          live.completion,

        coverageGap:
          live.coverageGap ??
          certifiedModule.coverageGap,

        conflict:
          live.conflict ??
          certifiedModule.conflict,
      };
    },
  );
}


export function runtimeCompatibleDashboard(
  runtime:
    EducationalDashboardData,
): EducationalDashboardData {
  const baseline =
    certifiedBaseline();

  return {
    state:
      runtime.state,

    /*
     * A successful Runtime response is authoritative even when
     * a collection is empty.
     *
     * Never resurrect certified/model fixture artifacts when
     * Runtime has intentionally projected no current-policy
     * educational knowledge.
     */
    artifacts:
      runtime.artifacts,

    modules:
      mergeRuntimeModules(
        baseline.modules,
        runtime.modules,
      ),

    competencies:
      runtime.competencies,

    timeline:
      runtime.timeline,
  };
}
