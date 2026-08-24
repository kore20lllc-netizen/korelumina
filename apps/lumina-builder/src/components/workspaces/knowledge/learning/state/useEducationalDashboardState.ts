import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createExecutiveEducationalSummary,
  filterEducationalTimeline,
} from "../model";

import {
  getEducationalDashboard,
} from "@/services/educationService";

import {
  certifiedBaseline,
  runtimeCompatibleDashboard,
} from "./EducationalRuntimeCompatibility";

import type {
  EducationalDashboardData,
} from "./EducationalRuntimeCompatibility";

import {
  useEducationalFilters,
} from "./useEducationalFilters";

import {
  useEducationalSelection,
} from "./useEducationalSelection";

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
