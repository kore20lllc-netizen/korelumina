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
    case "adapted":
      /*
       * Organizational Memory adaptation occurs only after
       * Canonical Knowledge has already been published.
       *
       * Keep the persisted backend lifecycle state as "adapted",
       * while the Flow Engine truthfully presents publication as
       * completed.
       */
      return "published";

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

function manufacturingRunDisplayId(
  runId:
    string,
): string {
  if (
    !runId.startsWith(
      "KMR-",
    )
  ) {
    return runId;
  }

  const suffix =
    runId.slice(
      4,
    );

  return `KMR-${suffix.slice(
    0,
    10,
  )}`;
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
     * Manufacturing Run identity and governed Knowledge Package
     * identity are separate contracts.
     *
     * Before package assembly, the manufacturing run is the only
     * authoritative process identity available.
     *
     * Once a Knowledge Package exists, its persistent KP-* identity
     * becomes the visible governed capsule identity and remains stable
     * through review, canonical promotion, adaptation and consumption.
     *
     * The KMR-* identity remains authoritative for process routing.
     */
    id:
      knowledgePackage
        ?.id ??
      run.id,

    identity:
      knowledgePackage
        ?.id ??
      manufacturingRunDisplayId(
        run.id,
      ),

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
        ? knowledgePackage.state ===
              "canonical" ||
            knowledgePackage.state ===
              "adapted"
          ? displayValue(
              knowledgePackage
                .destination,
              "Organizational Memory",
            )
          : displayValue(
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
   * The certified Flow Engine represents governed manufacturing
   * lifecycle state only.
   *
   * Historical packages that predate Manufacturing Runs remain
   * persisted and readable through the lifecycle/canonical APIs,
   * but without a Manufacturing Run they have no authoritative
   * station history and therefore must not be projected as active
   * Flow Engine capsules.
   */
  const capsules = [
    ...runCapsules,
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
              run.packageId &&
              packageById.has(
                run.packageId,
              )
                ? run.packageId
                : run.id,

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
