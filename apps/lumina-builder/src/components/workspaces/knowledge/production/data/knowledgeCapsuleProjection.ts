import type {
  KnowledgeManufacturingRunView,
  KnowledgeProductionLifecycleSnapshot,
} from "@/services/knowledgeOperationsService";

import type {
  KnowledgeCapsule,
  KnowledgeCapsuleState,
} from "../capsules/types";

import type {
  CapsuleManufacturingPosition,
  ManufacturingStation,
} from "../capsules/lifecycle";

export interface KnowledgeCapsuleProductionProjection {
  capsules:
    KnowledgeCapsule[];

  positions:
    CapsuleManufacturingPosition[];
}

type LifecyclePackage =
  KnowledgeProductionLifecycleSnapshot[
    "packages"
  ][number];

function stateForPackage(
  state:
    string,
): KnowledgeCapsuleState {
  switch (state) {
    case "captured":
    case "compiled":
      return "processing";

    case "validated":
      return "validated";

    case "awaiting_review":
      return "needs-review";

    case "approved":
      return "approved";

    case "canonical":
      return "published";

    case "adapted":
      return "adapted";

    case "consumed":
      return "consumed";

    case "superseded":
      return "superseded";

    case "archived":
      return "archived";

    case "rejected":
      return "failed";

    default:
      return "waiting";
  }
}

function stationForLegacyPackage(
  state:
    string,
): ManufacturingStation {
  switch (state) {
    case "captured":
      return "Evidence Intake";

    case "compiled":
      return "Knowledge IR";

    case "validated":
      return "Knowledge Package Assembly";

    case "awaiting_review":
    case "approved":
    case "rejected":
      return "Canonical Review";

    case "canonical":
    case "adapted":
    case "consumed":
    case "superseded":
    case "archived":
      return "Canonical Knowledge";

    default:
      return "Knowledge Package Assembly";
  }
}

function displayValue(
  value:
    string |
    null |
    undefined,

  fallback =
    "Unavailable",
): string {
  return (
    typeof value ===
      "string" &&
    value.trim()
      ? value
      : fallback
  );
}

function titleForPackage(
  knowledgePackage:
    LifecyclePackage,
): string {
  return (
    knowledgePackage
      .items[0]
      ?.title ??
    knowledgePackage.id
  );
}

function summaryForPackage(
  knowledgePackage:
    LifecyclePackage,
): string {
  return (
    knowledgePackage
      .items[0]
      ?.summary ??
    "Persisted governed Knowledge Package."
  );
}

function compilerForPackage(
  knowledgePackage:
    LifecyclePackage,
): string {
  const compiler =
    knowledgePackage
      .compilerHistory[0]
      ?.compiler
      ?.compilerName;

  return displayValue(
    compiler,
  );
}

function sourcesForPackage(
  knowledgePackage:
    LifecyclePackage,
): string[] {
  if (
    knowledgePackage
      .provenance
      .sourceLocations
      .length >
    0
  ) {
    return [
      ...knowledgePackage
        .provenance
        .sourceLocations,
    ];
  }

  if (
    knowledgePackage
      .provenance
      .sources
      .length >
    0
  ) {
    return [
      ...knowledgePackage
        .provenance
        .sources,
    ];
  }

  return [
    ...knowledgePackage
      .sourceEvidenceRefs,
  ];
}

function approvalForPackage(
  knowledgePackage:
    LifecyclePackage,
): string {
  switch (
    knowledgePackage
      .approvalState
  ) {
    case "pending_review":
      return "Human review required";

    case "approved":
      return "Approved";

    case "rejected":
      return "Rejected";

    case "remediation_required":
      return "Remediation required";

    default:
      return "Unavailable";
  }
}

function confidenceForPackage(
  knowledgePackage:
    LifecyclePackage,
): number {
  const value =
    knowledgePackage
      .confidence;

  return Math.round(
    value <= 1
      ? value * 100
      : value,
  );
}

function layersForPackage(
  knowledgePackage:
    LifecyclePackage,
): KnowledgeCapsule["layers"] {
  const provenanceHealthy =
    knowledgePackage
      .provenance
      .evidenceIds
      .length >
      0 ||
    knowledgePackage
      .sourceEvidenceRefs
      .length >
      0;

  const validationBlocked =
    knowledgePackage
      .validationResults
      .some(
        (result) =>
          result.blocked,
      );

  const remediationRequired =
    knowledgePackage
      .remediation
      .required;

  return [
    {
      id:
        "authority",

      label:
        "Authority",

      status:
        knowledgePackage
          .authority
          ? "healthy"
          : "warning",

      detail:
        knowledgePackage
          .authority
          ? `Authority: ${knowledgePackage.authority}.`
          : "Authority unavailable.",
    },
    {
      id:
        "provenance",

      label:
        "Provenance",

      status:
        provenanceHealthy
          ? "healthy"
          : "warning",

      detail:
        provenanceHealthy
          ? "Persisted evidence provenance is available."
          : "Persisted provenance references are unavailable.",
    },
    {
      id:
        "validation",

      label:
        "Validation",

      status:
        validationBlocked
          ? "failed"
          : "healthy",

      detail:
        validationBlocked
          ? "One or more validation results remain blocked."
          : "No blocked persisted validation results.",
    },
    {
      id:
        "governance",

      label:
        "Governance",

      status:
        remediationRequired
          ? "warning"
          : "healthy",

      detail:
        remediationRequired
          ? "Governed remediation is required."
          : `Lifecycle state: ${knowledgePackage.state}.`,
    },
  ];
}

function latestCurrentStageOutcome(
  run:
    KnowledgeManufacturingRunView,
) {
  return [
    ...run.stageHistory,
  ]
    .reverse()
    .find(
      (event) =>
        event.stage ===
        run.currentStage,
    )
    ?.outcome;
}

function stateForRun(
  run:
    KnowledgeManufacturingRunView,

  knowledgePackage:
    LifecyclePackage |
    undefined,
): KnowledgeCapsuleState {
  if (
    run.status ===
    "blocked"
  ) {
    return "blocked";
  }

  if (
    run.status ===
    "failed"
  ) {
    return "failed";
  }

  if (
    knowledgePackage
  ) {
    return stateForPackage(
      knowledgePackage.state,
    );
  }

  const latestOutcome =
    latestCurrentStageOutcome(
      run,
    );

  if (
    run.currentStage ===
    "Canonical Review"
  ) {
    return latestOutcome ===
      "awaiting_human_review"
      ? "needs-review"
      : "waiting";
  }

  if (
    run.currentStage ===
    "Canonical Knowledge"
  ) {
    return run.status ===
      "completed" ||
      latestOutcome ===
        "published"
      ? "published"
      : "approved";
  }

  if (
    run.currentStage ===
      "Validation" ||
    run.currentStage ===
      "Knowledge Package Assembly"
  ) {
    return "processing";
  }

  return "processing";
}

function prePackageLayers(
  run:
    KnowledgeManufacturingRunView,
): KnowledgeCapsule["layers"] {
  return [
    {
      id:
        "evidence",

      label:
        "Evidence",

      status:
        "healthy",

      detail:
        `Persisted evidence identity: ${run.evidenceId}.`,
    },
    {
      id:
        "manufacturing",

      label:
        "Manufacturing",

      status:
        run.status ===
          "failed"
          ? "failed"
          : run.status ===
              "blocked"
            ? "warning"
            : "healthy",

      detail:
        `Authoritative stage: ${run.currentStage}.`,
    },
  ];
}

function capsuleForRun(
  run:
    KnowledgeManufacturingRunView,

  knowledgePackage:
    LifecyclePackage |
    undefined,
): KnowledgeCapsule {
  const remediationRequired =
    knowledgePackage
      ?.remediation
      .required ??
    run.status ===
      "blocked";

  const sources =
    knowledgePackage
      ? sourcesForPackage(
          knowledgePackage,
        )
      : [
          run.evidenceId,
        ];

  return {
    /*
     * The Manufacturing Run is the capsule.
     *
     * This identity exists before compilation and remains stable
     * through package assembly, review and publication.
     */
    id:
      run.id,

    identity:
      run.id,

    title:
      knowledgePackage
        ? titleForPackage(
            knowledgePackage,
          )
        : run.evidenceId,

    summary:
      knowledgePackage
        ? summaryForPackage(
            knowledgePackage,
          )
        : "Persisted evidence is moving through the governed Knowledge Preservation manufacturing lifecycle.",

    stage:
      run.currentStage,

    destination:
      knowledgePackage
        ? displayValue(
            knowledgePackage
              .destination,
          )
        : "Canonical Knowledge",

    state:
      stateForRun(
        run,
        knowledgePackage,
      ),

    integrity:
      remediationRequired
        ? "peeling"
        : "sealed",

    authority:
      knowledgePackage
        ? displayValue(
            knowledgePackage
              .authority,
          )
        : "Unassigned",

    confidence:
      knowledgePackage
        ? confidenceForPackage(
            knowledgePackage,
          )
        : 0,

    owner:
      knowledgePackage
        ? displayValue(
            knowledgePackage
              .owner,
          )
        : "Unassigned",

    approval:
      knowledgePackage
        ? approvalForPackage(
            knowledgePackage,
          )
        : run.currentStage ===
            "Canonical Review"
          ? "Human review required"
          : "Not yet applicable",

    packageType:
      knowledgePackage
        ? displayValue(
            knowledgePackage
              .items[0]
              ?.type,
            "Knowledge Package",
          )
        : "Evidence",

    mission:
      "Unavailable",

    compiler:
      knowledgePackage
        ? compilerForPackage(
            knowledgePackage,
          )
        : "Pending compiler applicability",

    educationalModule:
      "Unavailable",

    consumer:
      "Unavailable",

    sources,

    failedLayer:
      run.status ===
        "failed"
        ? run.currentStage
        : remediationRequired
          ? "Validation"
          : undefined,

    remediation:
      run.status ===
        "blocked"
        ? `Manufacturing blocked at ${run.currentStage}.`
        : knowledgePackage
              ?.remediation
              .required
          ? `Remediation status: ${knowledgePackage.remediation.status}.`
          : undefined,

    responsibleAuthority:
      remediationRequired
        ? knowledgePackage
          ? displayValue(
              knowledgePackage
                .owner,
            )
          : "Unassigned"
        : undefined,

    blockedDependencies:
      knowledgePackage
        ?.remediation
        .required
        ? [
            ...knowledgePackage
              .dependencies,
          ]
        : undefined,

    layers:
      knowledgePackage
        ? layersForPackage(
            knowledgePackage,
          )
        : prePackageLayers(
            run,
          ),
  };
}

function capsuleForLegacyPackage(
  knowledgePackage:
    LifecyclePackage,
): KnowledgeCapsule {
  const remediationRequired =
    knowledgePackage
      .remediation
      .required;

  const sources =
    sourcesForPackage(
      knowledgePackage,
    );

  return {
    id:
      knowledgePackage.id,

    identity:
      knowledgePackage.id,

    title:
      titleForPackage(
        knowledgePackage,
      ),

    summary:
      summaryForPackage(
        knowledgePackage,
      ),

    stage:
      stationForLegacyPackage(
        knowledgePackage.state,
      ),

    destination:
      displayValue(
        knowledgePackage
          .destination,
      ),

    state:
      stateForPackage(
        knowledgePackage.state,
      ),

    integrity:
      remediationRequired
        ? "peeling"
        : "sealed",

    authority:
      displayValue(
        knowledgePackage
          .authority,
      ),

    confidence:
      confidenceForPackage(
        knowledgePackage,
      ),

    owner:
      displayValue(
        knowledgePackage
          .owner,
      ),

    approval:
      approvalForPackage(
        knowledgePackage,
      ),

    packageType:
      displayValue(
        knowledgePackage
          .items[0]
          ?.type,
        "Knowledge Package",
      ),

    mission:
      "Unavailable",

    compiler:
      compilerForPackage(
        knowledgePackage,
      ),

    educationalModule:
      "Unavailable",

    consumer:
      "Unavailable",

    sources:
      sources.length >
      0
        ? sources
        : [
            "Unavailable",
          ],

    failedLayer:
      remediationRequired
        ? "Validation"
        : undefined,

    remediation:
      remediationRequired
        ? `Remediation status: ${knowledgePackage.remediation.status}.`
        : undefined,

    responsibleAuthority:
      remediationRequired
        ? displayValue(
            knowledgePackage
              .owner,
          )
        : undefined,

    blockedDependencies:
      remediationRequired
        ? [
            ...knowledgePackage
              .dependencies,
          ]
        : undefined,

    layers:
      layersForPackage(
        knowledgePackage,
      ),
  };
}

export function createKnowledgeCapsuleProductionProjection(
  snapshot:
    KnowledgeProductionLifecycleSnapshot,
): KnowledgeCapsuleProductionProjection {
  const packageById =
    new Map(
      snapshot.packages.map(
        (
          knowledgePackage,
        ) => [
          knowledgePackage.id,
          knowledgePackage,
        ] as const,
      ),
    );

  const packageIdsOwnedByRuns =
    new Set(
      snapshot.manufacturingRuns
        .map(
          (run) =>
            run.packageId,
        )
        .filter(
          (
            id,
          ): id is string =>
            typeof id ===
              "string" &&
            id.length >
              0,
        ),
    );

  const runCapsules =
    snapshot.manufacturingRuns.map(
      (run) => {
        const replay =
          snapshot.manufacturingReplay;

        const projectedRun =
          replay?.active &&
          replay.runId ===
            run.id
            ? {
                ...run,

                currentStage:
                  replay.stage,
              }
            : run;

        return capsuleForRun(
          projectedRun,
          run.packageId
            ? packageById.get(
                run.packageId,
              )
            : undefined,
        );
      },
    );

  /*
   * Backward compatibility:
   *
   * packages created before Manufacturing Runs existed remain
   * observable, but any package already linked to a run is not
   * duplicated as a second capsule.
   */
  const legacyPackages =
    snapshot.packages.filter(
      (knowledgePackage) =>
        !packageIdsOwnedByRuns.has(
          knowledgePackage.id,
        ),
    );

  const legacyCapsules =
    legacyPackages.map(
      capsuleForLegacyPackage,
    );

  const capsules = [
    ...runCapsules,
    ...legacyCapsules,
  ];

  const positions:
    CapsuleManufacturingPosition[] = [
      ...snapshot.manufacturingRuns.map(
        (
          run,
          index,
        ) => {
          const replay =
            snapshot.manufacturingReplay;

          return {
            capsuleId:
              run.id,

            station:
              replay?.active &&
              replay.runId ===
                run.id
                ? replay.stage
                : run.currentStage,

            queuePosition:
              index +
              1,

            branches:
              [],
          };
        },
      ),

      ...legacyPackages.map(
        (
          knowledgePackage,
          index,
        ) => ({
          capsuleId:
            knowledgePackage.id,

          station:
            stationForLegacyPackage(
              knowledgePackage.state,
            ),

          queuePosition:
            snapshot
              .manufacturingRuns
              .length +
            index +
            1,

          branches:
            [],
        }),
      ),
    ];

  return {
    capsules,
    positions,
  };
}

export const emptyKnowledgeCapsuleProductionProjection:
  KnowledgeCapsuleProductionProjection = {
    capsules:
      [],

    positions:
      [],
  };
