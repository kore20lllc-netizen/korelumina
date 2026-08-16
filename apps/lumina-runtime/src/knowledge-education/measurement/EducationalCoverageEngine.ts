import type {
  EducationalArtifactProjection,
} from "../projection/index.js";

export interface EducationalCoverageRequirement {
  id:
    string;

  description:
    string;

  match:
    {
      artifactIds?:
        string[];

      kinds?:
        string[];

      titleIncludes?:
        string[];

      categories?:
        string[];

      sourceRefs?:
        string[];
    };
}

export interface EducationalCoverageResult {
  completion:
    number;

  satisfied:
    string[];

  missing:
    string[];

  satisfiedCount:
    number;

  requirementCount:
    number;

  measurementVersion:
    "education-coverage-v1";
}

function normalize(
  value:
    string,
): string {
  return value
    .trim()
    .toLowerCase();
}

function normalizeSourceRef(
  value:
    string,
): string {
  const normalized =
    value
      .trim()
      .replace(
        /\\\\/g,
        "/",
      );

  const architectureMarker =
    "/docs/architecture/";

  const architectureIndex =
    normalized
      .toLowerCase()
      .indexOf(
        architectureMarker,
      );

  if (
    architectureIndex >=
      0
  ) {
    return normalized
      .slice(
        architectureIndex +
          1,
      )
      .toLowerCase();
  }

  const rootArchitecture =
    "korelumina_master_architecture.md";

  if (
    normalized
      .toLowerCase()
      .endsWith(
        `/${rootArchitecture}`,
      ) ||
    normalized
      .toLowerCase() ===
      rootArchitecture
  ) {
    return rootArchitecture;
  }

  return normalized
    .replace(
      /^\.\//,
      "",
    )
    .toLowerCase();
}

function sourceRefMatches(
  artifactRef:
    string,
  requiredRef:
    string,
): boolean {
  const artifact =
    normalizeSourceRef(
      artifactRef,
    );

  const required =
    normalizeSourceRef(
      requiredRef,
    );

  if (
    artifact ===
      required
  ) {
    return true;
  }

  /*
   * Legacy canonical evidence may retain only the repository basename.
   * A basename may satisfy a governed path only when that basename is
   * identical. This does not use title/content fuzzy matching.
   */
  const artifactBasename =
    artifact
      .split("/")
      .at(-1);

  const requiredBasename =
    required
      .split("/")
      .at(-1);

  return (
    Boolean(
      artifactBasename,
    ) &&
    artifactBasename ===
      requiredBasename
  );
}

function artifactSatisfies(
  artifact:
    EducationalArtifactProjection,

  requirement:
    EducationalCoverageRequirement,
): boolean {
  const {
    artifactIds = [],
    kinds = [],
    titleIncludes = [],
    categories = [],
    sourceRefs = [],
  } =
    requirement.match;

  const checks:
    boolean[] = [];

  if (
    artifactIds.length >
      0
  ) {
    checks.push(
      artifactIds.includes(
        artifact.id,
      ),
    );
  }

  if (
    kinds.length >
      0
  ) {
    checks.push(
      kinds.includes(
        artifact.kind,
      ),
    );
  }

  if (
    titleIncludes.length >
      0
  ) {
    const title =
      normalize(
        artifact.title,
      );

    checks.push(
      titleIncludes.some(
        (needle) =>
          title.includes(
            normalize(
              needle,
            ),
          ),
      ),
    );
  }

  if (
    sourceRefs.length >
      0
  ) {
    const artifactRefs =
      Array.isArray(
        artifact.sourceRefs,
      )
        ? artifact.sourceRefs.filter(
            (
              ref,
            ): ref is string =>
              typeof ref ===
                "string" &&
              ref.trim().length >
                0,
          )
        : [];

    checks.push(
      sourceRefs.some(
        (requiredRef) =>
          artifactRefs.some(
            (artifactRef) =>
              sourceRefMatches(
                artifactRef,
                requiredRef,
              ),
          ),
      ),
    );
  }

  if (
    categories.length >
      0
  ) {
    const category =
      normalize(
        artifact.category,
      );

    checks.push(
      categories.some(
        (candidate) =>
          category ===
          normalize(
            candidate,
          ),
      ),
    );
  }

  return (
    checks.length >
      0 &&
    checks.every(
      Boolean,
    )
  );
}

export function educationalStatusFromCoverage(
  completion:
    number,

  conflict?:
    string,
):
  | "completed"
  | "active"
  | "blocked"
  | "not-started" {
  if (
    completion ===
      100
  ) {
    return "completed";
  }

  if (
    conflict &&
    completion <
      100
  ) {
    return "blocked";
  }

  if (
    completion ===
      0
  ) {
    return "not-started";
  }

  return "active";
}

export function measureEducationalCoverage(
  artifacts:
    readonly EducationalArtifactProjection[],

  requirements:
    readonly EducationalCoverageRequirement[],
): EducationalCoverageResult {
  if (
    requirements.length ===
      0
  ) {
    return {
      completion:
        0,

      satisfied:
        [],

      missing:
        [],

      satisfiedCount:
        0,

      requirementCount:
        0,

      measurementVersion:
        "education-coverage-v1",
    };
  }

  const satisfied:
    string[] = [];

  const missing:
    string[] = [];

  for (
    const requirement
    of requirements
  ) {
    const met =
      artifacts.some(
        (artifact) =>
          artifactSatisfies(
            artifact,
            requirement,
          ),
      );

    if (
      met
    ) {
      satisfied.push(
        requirement.id,
      );
    } else {
      missing.push(
        requirement.id,
      );
    }
  }

  const completion =
    Math.round(
      (
        satisfied.length /
        requirements.length
      ) *
      100,
    );

  return {
    completion,

    satisfied,

    missing,

    satisfiedCount:
      satisfied.length,

    requirementCount:
      requirements.length,

    measurementVersion:
      "education-coverage-v1",
  };
}
