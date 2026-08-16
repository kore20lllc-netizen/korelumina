import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  certifiedEducationalDashboardContract,
} from "./contracts/CertifiedEducationalDashboardContract";

import {
  createExecutiveEducationalSummary,
  filterEducationalTimeline,
} from "../model";

import type {
  CompetencyObjective,
  EducationalArtifact,
  EducationalModule,
  EducationalTimelineEvent,
  EducationalUiState,
} from "../model";

import {
  getEducationalDashboard,
} from "@/services/educationService";

import {
  useEducationalFilters,
} from "./useEducationalFilters";

import {
  useEducationalSelection,
} from "./useEducationalSelection";

interface EducationalDashboardData {
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
function certifiedBaseline():
EducationalDashboardData {
  return {
    state:
      certifiedEducationalDashboardContract.state,

    artifacts:
      certifiedEducationalDashboardContract.artifacts,

    modules:
      certifiedEducationalDashboardContract.modules.map(
        (module) => ({
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
        (module) => [
          module.id,
          module,
        ],
      ),
    );

  return baseline.map(
    (certifiedModule) => {
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

function runtimeCompatibleDashboard(
  runtime:
    EducationalDashboardData,
): EducationalDashboardData {
  const baseline =
    certifiedBaseline();

  return {
    state:
      baseline.state,

    artifacts:
      runtime.artifacts.length >
        0
        ? runtime.artifacts
        : baseline.artifacts,

    modules:
      mergeRuntimeModules(
        baseline.modules,
        runtime.modules,
      ),

    competencies:
      runtime.competencies.length >
        0
        ? runtime.competencies
        : baseline.competencies,

    timeline:
      runtime.timeline.length >
        0
        ? runtime.timeline
        : baseline.timeline,
  };
}

export function useEducationalDashboardState() {
  const [
    dashboard,
    setDashboard,
  ] =
    useState<EducationalDashboardData>(
      () =>
        certifiedBaseline(),
    );

  const [
    runtimeConnected,
    setRuntimeConnected,
  ] =
    useState(
      false,
    );

  const filters =
    useEducationalFilters(
      dashboard.artifacts,
    );

  const selection =
    useEducationalSelection(
      dashboard.artifacts,
      dashboard.modules,
    );

  const loadRuntime =
    useCallback(
      async () => {
        try {
          const runtime =
            await getEducationalDashboard();

          setDashboard(
            runtimeCompatibleDashboard(
              runtime,
            ),
          );

          setRuntimeConnected(
            true,
          );
        } catch {
          /*
           * Runtime failure must never resurrect modeled progress.
           *
           * Preserve UI topology while resetting progress to the
           * neutral certified baseline.
           */
          setDashboard(
            certifiedBaseline(),
          );

          setRuntimeConnected(
            false,
          );
        }
      },
      [],
    );

  useEffect(
    () => {
      void loadRuntime();
    },
    [
      loadRuntime,
    ],
  );

  const executiveSummary =
    useMemo(
      () =>
        createExecutiveEducationalSummary(
          dashboard.artifacts,
          dashboard.modules,
        ),
      [
        dashboard.artifacts,
        dashboard.modules,
      ],
    );

  const visibleTimeline =
    useMemo(
      () =>
        filterEducationalTimeline(
          dashboard.timeline,
          selection.timelineType,
        ),
      [
        dashboard.timeline,
        selection.timelineType,
      ],
    );

  const reset =
    useCallback(
      () => {
        filters.resetFilters();

        selection.setTimelineType(
          "all",
        );

        void loadRuntime();
      },
      [
        filters,
        selection,
        loadRuntime,
      ],
    );

  return {
    uiState:
      dashboard.state,

    executiveSummary,

    artifacts:
      dashboard.artifacts,

    modules:
      dashboard.modules,

    competencies:
      dashboard.competencies,

    timeline:
      dashboard.timeline,

    visibleTimeline,

    filters,
    selection,
    reset,

    runtimeConnected,
  };
}
