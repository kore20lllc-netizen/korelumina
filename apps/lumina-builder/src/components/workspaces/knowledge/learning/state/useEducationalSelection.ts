import {
  useMemo,
  useState,
} from "react";

import {
  selectEducationalArtifact,
  selectEducationalModule,
} from "../model";

import type {
  EducationalArtifact,
  EducationalModule,
} from "../model";

export function useEducationalSelection(
  artifacts: EducationalArtifact[],
  modules: EducationalModule[],
) {
  const [
    artifactId,
    setArtifactId,
  ] = useState<string | null>(
    artifacts[0]?.id ?? null,
  );

  const [
    moduleId,
    setModuleId,
  ] = useState<string | null>(
    modules[0]?.id ?? null,
  );

  const [
    timelineType,
    setTimelineType,
  ] = useState("all");

  const selectedArtifact =
    useMemo(
      () =>
        selectEducationalArtifact(
          artifacts,
          artifactId,
        ),
      [
        artifacts,
        artifactId,
      ],
    );

  const selectedModule =
    useMemo(
      () =>
        selectEducationalModule(
          modules,
          moduleId,
        ),
      [
        modules,
        moduleId,
      ],
    );

  return {
    artifactId,
    moduleId,
    timelineType,
    selectedArtifact,
    selectedModule,
    setArtifactId,
    setModuleId,
    setTimelineType,
  };
}
