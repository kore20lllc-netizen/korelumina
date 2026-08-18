import {
  useMemo,
  useState,
} from "react";

import {
  filterEducationalArtifacts,
  getDistinctApprovalStates,
  getDistinctAuthorityClasses,
  getDistinctCategories,
} from "../model";

import type {
  EducationalArtifact,
  EducationalArtifactFilters,
} from "../model";

const INITIAL_FILTERS: EducationalArtifactFilters = {
  query: "",
  authority: "all",
  approval: "all",
  category: "all",
};

export function useEducationalFilters(
  artifacts: EducationalArtifact[],
) {
  const [
    filters,
    setFilters,
  ] = useState<EducationalArtifactFilters>(
    INITIAL_FILTERS,
  );

  const visibleArtifacts =
    useMemo(
      () =>
        filterEducationalArtifacts(
          artifacts,
          filters,
        ),
      [
        artifacts,
        filters,
      ],
    );

  const authorityOptions =
    useMemo(
      () =>
        getDistinctAuthorityClasses(
          artifacts,
        ),
      [artifacts],
    );

  const approvalOptions =
    useMemo(
      () =>
        getDistinctApprovalStates(
          artifacts,
        ),
      [artifacts],
    );

  const categoryOptions =
    useMemo(
      () =>
        getDistinctCategories(
          artifacts,
        ),
      [artifacts],
    );

  const updateFilter = <
    Key extends keyof EducationalArtifactFilters,
  >(
    key: Key,
    value:
      EducationalArtifactFilters[Key],
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  return {
    filters,
    visibleArtifacts,
    authorityOptions,
    approvalOptions,
    categoryOptions,
    updateFilter,
    resetFilters,
  };
}
