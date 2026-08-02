import {
  useMemo,
  useState,
} from "react";

import {
  createExecutiveEducationalSummary,
  filterEducationalTimeline,
} from "../model";

import {
  educationalFixture,
} from "../fixtures";

import {
  useEducationalFilters,
} from "./useEducationalFilters";

import {
  useEducationalSelection,
} from "./useEducationalSelection";

import type {
  EducationalUiState,
} from "../model";

export function useEducationalDashboardState() {
  const [
    uiState,
    setUiState,
  ] = useState<EducationalUiState>(
    educationalFixture.state,
  );

  const filters =
    useEducationalFilters(
      educationalFixture.artifacts,
    );

  const selection =
    useEducationalSelection(
      educationalFixture.artifacts,
      educationalFixture.modules,
    );

  const executiveSummary =
    useMemo(
      () =>
        createExecutiveEducationalSummary(
          educationalFixture.artifacts,
          educationalFixture.modules,
        ),
      [],
    );

  const visibleTimeline =
    useMemo(
      () =>
        filterEducationalTimeline(
          educationalFixture.timeline,
          selection.timelineType,
        ),
      [selection.timelineType],
    );

  const reset = () => {
    setUiState(
      educationalFixture.state,
    );
    filters.resetFilters();
    selection.setArtifactId(
      educationalFixture.artifacts[0]
        ?.id ?? null,
    );
    selection.setModuleId(
      educationalFixture.modules[0]
        ?.id ?? null,
    );
    selection.setTimelineType(
      "all",
    );
  };

  return {
    uiState,
    setUiState,
    executiveSummary,
    artifacts:
      educationalFixture.artifacts,
    modules:
      educationalFixture.modules,
    competencies:
      educationalFixture.competencies,
    timeline:
      educationalFixture.timeline,
    visibleTimeline,
    filters,
    selection,
    reset,
  };
}
