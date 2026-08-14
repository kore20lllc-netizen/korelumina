import type {
  KnowledgeProductionLifecycleSnapshot,
} from "@/services/knowledgeOperationsService";

export interface OrganizationalMemoryProjectionSlot {
  id: string;
  capsuleId: string;
  title: string;
  audience: string;
  privacy: string;
  status: string;
  detail: string;
  canonicalSource: string;
  adaptationLineage: string;
  authorityPosture: string;
}

export interface OrganizationalMemoryPrivacySlot {
  label: string;
  title: string;
  detail: string;
}

export interface OrganizationalMemoryLineageSlot {
  label: string;
  value: string;
}

export interface OrganizationalMemorySummarySlot {
  title: string;
  detail: string;
  lineage: string;
}

export interface OrganizationalMemoryEvolutionSlot {
  version: string;
  event: string;
  detail: string;
}

export interface OrganizationalMemoryProjection {
  metrics: {
    activeProjections: string;
    privacyFilters: string;
    institutionalSummaries: string;
    adaptationGenerations: string;
  };

  projections:
    OrganizationalMemoryProjectionSlot[];

  privacy:
    OrganizationalMemoryPrivacySlot[];

  lineage:
    OrganizationalMemoryLineageSlot[];

  summaries:
    OrganizationalMemorySummarySlot[];

  evolution:
    OrganizationalMemoryEvolutionSlot[];
}

type MemoryRecord =
  KnowledgeProductionLifecycleSnapshot[
    "organizationalMemory"
  ][number];

function asRecord(
  value:
    unknown,
): Record<string, unknown> | undefined {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return undefined;
  }

  return value as
    Record<string, unknown>;
}

function stringValue(
  value:
    unknown,
): string | undefined {
  return (
    typeof value === "string" &&
    value.trim()
      ? value
      : undefined
  );
}

function stringArray(
  value:
    unknown,
): string[] {
  return Array.isArray(value)
    ? value.filter(
        (
          item,
        ): item is string =>
          typeof item === "string" &&
          Boolean(item.trim()),
      )
    : [];
}

function governanceFor(
  record:
    MemoryRecord,
) {
  return asRecord(
    record.governance,
  );
}

function canonicalItemIdFor(
  record:
    MemoryRecord,
): string {
  return (
    stringValue(
      governanceFor(record)
        ?.canonicalItemId,
    ) ??
    "Unavailable"
  );
}

function packageIdFor(
  record:
    MemoryRecord,
): string {
  return (
    stringValue(
      governanceFor(record)
        ?.packageId,
    ) ??
    canonicalItemIdFor(
      record,
    )
  );
}

function packageVersionFor(
  record:
    MemoryRecord,
): string {
  return (
    stringValue(
      governanceFor(record)
        ?.packageVersion,
    ) ??
    "Unversioned"
  );
}

function lineageFor(
  record:
    MemoryRecord,
): string[] {
  return stringArray(
    governanceFor(record)
      ?.lineage,
  );
}

function privacyFor(
  record:
    MemoryRecord,
) {
  return asRecord(
    governanceFor(record)
      ?.privacy,
  );
}

function trustFor(
  record:
    MemoryRecord,
) {
  return asRecord(
    governanceFor(record)
      ?.trust,
  );
}

function audienceFor(
  record:
    MemoryRecord,
): string {
  if (
    record.teamId
  ) {
    return record.teamId;
  }

  if (
    record.projectId
  ) {
    return record.projectId;
  }

  return (
    record.organizationId ||
    "Organizational"
  );
}

function projectionSlot(
  record:
    MemoryRecord |
    undefined,
  index:
    number,
): OrganizationalMemoryProjectionSlot {
  if (
    !record
  ) {
    return {
      id:
        `memory-projection-unavailable-${index + 1}`,

      capsuleId:
        "unavailable",

      title:
        "No additional governed memory projection",

      audience:
        "Unavailable",

      privacy:
        "Unavailable",

      status:
        "Unavailable",

      detail:
        "No additional persisted Organizational Memory record is available.",

      canonicalSource:
        "Unavailable",

      adaptationLineage:
        "Unavailable",

      authorityPosture:
        "Stewarded, not canonical",
    };
  }

  const privacy =
    privacyFor(
      record,
    );

  const trust =
    trustFor(
      record,
    );

  const lineage =
    lineageFor(
      record,
    );

  return {
    id:
      record.id,

    capsuleId:
      packageIdFor(
        record,
      ),

    title:
      record.title,

    audience:
      audienceFor(
        record,
      ),

    privacy:
      privacy?.generalized === true
        ? "Generalized"
        : "Governed",

    status:
      trust?.adaptationValidated ===
        true
        ? "Active"
        : "Governed",

    detail:
      record.summary,

    canonicalSource:
      packageIdFor(
        record,
      ),

    adaptationLineage:
      lineage.length > 0
        ? lineage[
            lineage.length -
              1
          ]
        : packageVersionFor(
            record,
          ),

    authorityPosture:
      "Stewarded, not canonical",
  };
}

export function createOrganizationalMemoryProjection(
  snapshot:
    KnowledgeProductionLifecycleSnapshot,
): OrganizationalMemoryProjection {
  const records =
    snapshot
      .organizationalMemory;

  const primary =
    records[0];

  const governance =
    primary
      ? governanceFor(
          primary,
        )
      : undefined;

  const privacy =
    primary
      ? privacyFor(
          primary,
        )
      : undefined;

  const lineage =
    primary
      ? lineageFor(
          primary,
        )
      : [];

  const generalizedCount =
    records.filter(
      (record) =>
        privacyFor(
          record,
        )?.generalized ===
        true,
    ).length;

  const projections = [
    projectionSlot(
      records[0],
      0,
    ),
    projectionSlot(
      records[1],
      1,
    ),
    projectionSlot(
      records[2],
      2,
    ),
  ];

  const privacySlots:
    OrganizationalMemoryPrivacySlot[] = [
      {
        label:
          "Canonical adaptation",

        title:
          primary
            ? (
                privacy?.generalized ===
                  true
                  ? "Generalized memory projection"
                  : "Governed privacy boundary"
              )
            : "Unavailable",

        detail:
          primary
            ? (
                privacy
                  ?.customerSpecificContentRetained ===
                false
                  ? "Customer-specific content is not retained in the persisted memory projection."
                  : "Persisted privacy detail unavailable."
              )
            : "No persisted Organizational Memory record is available.",
      },
      {
        label:
          "Canonical authority",

        title:
          primary
            ? "Authority remains external"
            : "Unavailable",

        detail:
          primary
            ? "Organizational Memory remains a stewarded adaptation and does not acquire canonical authority."
            : "No persisted Organizational Memory record is available.",
      },
      {
        label:
          "Approval boundary",

        title:
          stringValue(
            asRecord(
              governance
                ?.approval,
            )?.reviewerId,
          ) ??
          "Unavailable",

        detail:
          primary
            ? "Human canonical approval remains traceable through the adapted memory record."
            : "No persisted Organizational Memory record is available.",
      },
    ];

  const lineageSlots:
    OrganizationalMemoryLineageSlot[] = [
      {
        label:
          "Origin",

        value:
          primary
            ? `${packageIdFor(primary)} · ${packageVersionFor(primary)}`
            : "Unavailable",
      },
      {
        label:
          "Stewarded memory",

        value:
          primary?.id ??
          "Unavailable",
      },
      {
        label:
          "Active projections",

        value:
          `${records.length} governed ${
            records.length === 1
              ? "adaptation"
              : "adaptations"
          }`,
      },
    ];

  const summarySlots:
    OrganizationalMemorySummarySlot[] = [
      {
        title:
          primary?.title ??
          "No governed memory summary",

        detail:
          primary?.summary ??
          "No persisted Organizational Memory record is available.",

        lineage:
          primary
            ? `Derived from ${packageIdFor(primary)}`
            : "Lineage unavailable",
      },
      {
        title:
          "Canonical provenance",

        detail:
          primary
            ? (
                stringArray(
                  governance
                    ?.provenanceRefs,
                ).length >
                0
                  ? "Persisted provenance references remain attached to the memory adaptation."
                  : "No persisted provenance references are available."
              )
            : "No persisted Organizational Memory record is available.",

        lineage:
          primary
            ? `${stringArray(
                governance
                  ?.provenanceRefs,
              ).length} provenance references`
            : "Lineage unavailable",
      },
      {
        title:
          "Institutional adaptation",

        detail:
          primary
            ? "The adapted record preserves canonical lineage without transferring canonical authority."
            : "No persisted Organizational Memory record is available.",

        lineage:
          primary
            ? `Derived from ${records.length} governed ${
                records.length === 1
                  ? "adaptation"
                  : "adaptations"
              }`
            : "Lineage unavailable",
      },
    ];

  const evolutionSlots:
    OrganizationalMemoryEvolutionSlot[] = [
      {
        version:
          primary
            ? packageVersionFor(
                primary,
              )
            : "Unavailable",

        event:
          primary
            ? "Canonical knowledge received"
            : "No persisted memory state",

        detail:
          primary
            ? `Canonical source ${packageIdFor(primary)} entered Organizational Memory stewardship.`
            : "No persisted Organizational Memory record is available.",
      },
      {
        version:
          primary?.id ??
          "Unavailable",

        event:
          primary
            ? "Governed adaptation created"
            : "Unavailable",

        detail:
          primary
            ? "A governed Organizational Memory record was persisted from canonical knowledge."
            : "No persisted Organizational Memory record is available.",
      },
      {
        version:
          primary
            ? "Privacy gate"
            : "Unavailable",

        event:
          primary
            ? (
                privacy?.generalized ===
                  true
                  ? "Privacy generalization validated"
                  : "Privacy state recorded"
              )
            : "Unavailable",

        detail:
          primary
            ? "Privacy metadata remains preserved with the memory adaptation."
            : "No persisted Organizational Memory record is available.",
      },
      {
        version:
          primary
            ? "Lineage"
            : "Unavailable",

        event:
          primary
            ? "Adaptation lineage preserved"
            : "Unavailable",

        detail:
          primary
            ? (
                lineage.length >
                0
                  ? `${lineage.length} lineage references remain attached to the governed memory record.`
                  : "Canonical source identity remains preserved even though no additional lineage entries are available."
              )
            : "No persisted Organizational Memory record is available.",
      },
    ];

  return {
    metrics: {
      activeProjections:
        String(
          records.length,
        ),

      privacyFilters:
        String(
          generalizedCount,
        ),

      institutionalSummaries:
        records.length >
        0
          ? "1"
          : "0",

      adaptationGenerations:
        "—",
    },

    projections,

    privacy:
      privacySlots,

    lineage:
      lineageSlots,

    summaries:
      summarySlots,

    evolution:
      evolutionSlots,
  };
}

export const emptyOrganizationalMemoryProjection =
  createOrganizationalMemoryProjection({
    ok:
      true,

    packages:
      [],

    canonicalItems:
      [],

    organizationalMemory:
      [],

    summary: {
      packages:
        0,

      awaitingReview:
        0,

      approved:
        0,

      canonical:
        0,

      adapted:
        0,

      canonicalItems:
        0,

      organizationalMemory:
        0,
    },
  });
