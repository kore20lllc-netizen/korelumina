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

function certifiedBaseline():
EducationalDashboardData {
  return {
    state:
      certifiedEducationalDashboardContract.state,

    artifacts:
      certifiedEducationalDashboardContract.artifacts,

    modules:
      certifiedEducationalDashboardContract.modules,

    competencies:
      certifiedEducationalDashboardContract.competencies,

    timeline:
      certifiedEducationalDashboardContract.timeline,
  };
}

function runtimeCompatibleDashboard(
  runtime:
    EducationalDashboardData,
): EducationalDashboardData {
  const baseline =
    certifiedBaseline();

  /*
   * UI is the contract.
   *
   * Runtime may replace a certified data domain only when it
   * supplies a complete compatible collection. Missing backend
   * domains retain the certified baseline rather than altering
   * workspace composition.
   */
  return {
    state:
      baseline.state,

    artifacts:
      runtime.artifacts.length >
        0
        ? runtime.artifacts
        : baseline.artifacts,

    modules:
      runtime.modules.length ===
        baseline.modules.length
        ? runtime.modules
        : baseline.modules,

    competencies:
      runtime.competencies.length ===
        baseline.competencies.length
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
           * Runtime availability must never mutate the certified
           * Education composition. Keep the last compatible
           * dashboard state.
           */
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
