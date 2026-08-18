import type {
  EducationalArtifact,
  EducationalArtifactFilters,
  EducationalModule,
  EducationalTimelineEvent,
} from "./types";

export function selectEducationalArtifact(
  artifacts: EducationalArtifact[],
  artifactId: string | null,
): EducationalArtifact | null {
  if (!artifactId) {
    return null;
  }

  return (
    artifacts.find(
      (artifact) =>
        artifact.id === artifactId,
    ) ?? null
  );
}

export function selectEducationalModule(
  modules: EducationalModule[],
  moduleId: string | null,
): EducationalModule | null {
  if (!moduleId) {
    return null;
  }

  return (
    modules.find(
      (module) =>
        module.id === moduleId,
    ) ?? null
  );
}

export function filterEducationalArtifacts(
  artifacts: EducationalArtifact[],
  filters: EducationalArtifactFilters,
): EducationalArtifact[] {
  const normalizedQuery =
    filters.query.trim().toLowerCase();

  return artifacts.filter((artifact) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [
        artifact.id,
        artifact.title,
        artifact.category,
        artifact.authorityClass,
        artifact.approvalState,
        artifact.owner,
        artifact.scope,
        artifact.version,
        artifact.provenance,
        artifact.source,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

    const matchesAuthority =
      filters.authority === "all" ||
      artifact.authorityClass ===
        filters.authority;

    const matchesApproval =
      filters.approval === "all" ||
      artifact.approvalState ===
        filters.approval;

    const matchesCategory =
      filters.category === "all" ||
      artifact.category ===
        filters.category;

    return (
      matchesQuery &&
      matchesAuthority &&
      matchesApproval &&
      matchesCategory
    );
  });
}

export function filterEducationalTimeline(
  events: EducationalTimelineEvent[],
  type: string,
): EducationalTimelineEvent[] {
  if (type === "all") {
    return events;
  }

  return events.filter(
    (event) =>
      event.type === type,
  );
}

export function getDistinctAuthorityClasses(
  artifacts: EducationalArtifact[],
): string[] {
  return [
    "all",
    ...Array.from(
      new Set(
        artifacts.map(
          (artifact) =>
            artifact.authorityClass,
        ),
      ),
    ).sort(),
  ];
}

export function getDistinctApprovalStates(
  artifacts: EducationalArtifact[],
): string[] {
  return [
    "all",
    ...Array.from(
      new Set(
        artifacts.map(
          (artifact) =>
            artifact.approvalState,
        ),
      ),
    ).sort(),
  ];
}

export function getDistinctCategories(
  artifacts: EducationalArtifact[],
): string[] {
  return [
    "all",
    ...Array.from(
      new Set(
        artifacts.map(
          (artifact) =>
            artifact.category,
        ),
      ),
    ).sort(),
  ];
}

export function calculateEducationalCompletion(
  modules: EducationalModule[],
): number {
  if (modules.length === 0) {
    return 0;
  }

  return Math.round(
    modules.reduce(
      (total, module) =>
        total + module.completion,
      0,
    ) / modules.length,
  );
}
