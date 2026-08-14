import type {
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

function stateForPackage(
  state:
    string,
): KnowledgeCapsuleState {
  switch (
    state
  ) {
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

function stationForPackage(
  state:
    string,
): ManufacturingStation {
  switch (
    state
  ) {
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
    KnowledgeProductionLifecycleSnapshot["packages"][number],
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
    KnowledgeProductionLifecycleSnapshot["packages"][number],
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
    KnowledgeProductionLifecycleSnapshot["packages"][number],
): string {
  const compiler =
    knowledgePackage
      .compilerHistory[0]
      ?.compiler
      ?.compilerName;

  return displayValue(
    compiler,
    "Unavailable",
  );
}

function sourcesForPackage(
  knowledgePackage:
    KnowledgeProductionLifecycleSnapshot["packages"][number],
): string[] {
  const sourceLocations =
    knowledgePackage
      .provenance
      .sourceLocations;

  if (
    sourceLocations.length >
    0
  ) {
    return [
      ...sourceLocations,
    ];
  }

  if (
    knowledgePackage
      .provenance
      .sources.length >
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
    KnowledgeProductionLifecycleSnapshot["packages"][number],
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

function layersForPackage(
  knowledgePackage:
    KnowledgeProductionLifecycleSnapshot["packages"][number],
): KnowledgeCapsule["layers"] {
  const provenanceHealthy =
    knowledgePackage
      .provenance
      .evidenceIds.length >
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

export function createKnowledgeCapsuleProductionProjection(
  snapshot:
    KnowledgeProductionLifecycleSnapshot,
): KnowledgeCapsuleProductionProjection {
  const capsules =
    snapshot.packages.map(
      (
        knowledgePackage,
      ): KnowledgeCapsule => {
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
            stationForPackage(
              knowledgePackage
                .state,
            ),

          destination:
            displayValue(
              knowledgePackage
                .destination,
            ),

          state:
            stateForPackage(
              knowledgePackage
                .state,
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
            Math.round(
              knowledgePackage
                .confidence *
                100,
            ) <= 100
              ? Math.round(
                  knowledgePackage
                    .confidence *
                    100,
                )
              : Math.round(
                  knowledgePackage
                    .confidence,
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
      },
    );

  const positions =
    snapshot.packages.map(
      (
        knowledgePackage,
        index,
      ): CapsuleManufacturingPosition => ({
        capsuleId:
          knowledgePackage.id,

        station:
          stationForPackage(
            knowledgePackage.state,
          ),

        queuePosition:
          index +
          1,

        branches:
          [],
      }),
    );

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
