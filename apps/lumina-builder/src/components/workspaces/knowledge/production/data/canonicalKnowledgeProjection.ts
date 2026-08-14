import type {
  KnowledgeProductionLifecycleSnapshot,
} from "@/services/knowledgeOperationsService";

export interface CanonicalKnowledgeProjectionItem {
  id: string;
  displayId: string;
  capsuleId: string;
  title: string;
  collection: string;
  authority: string;
  trust: string;
  scope: string;
  version: string;
  status: string;
  supersession: string;
  retirement: string;
  rationale: string[];
}

export interface CanonicalKnowledgeCollectionProjection {
  title: string;
  count: string;
  authority: string;
  scope: string;
}

export interface CanonicalKnowledgeProjection {
  capsules:
    CanonicalKnowledgeProjectionItem[];

  collections:
    CanonicalKnowledgeCollectionProjection[];

  metrics: {
    published:
      string;

    collections:
      string;

    constitutional:
      string;

    retiring:
      string;

    supersessionActivity:
      string;

    superseded:
      string;

    retirementScheduled:
      string;
  };
}

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
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return value.filter(
    (
      entry,
    ): entry is string =>
      typeof entry === "string" &&
      Boolean(entry.trim()),
  );
}

function packageIdForCanonicalItem(
  item:
    KnowledgeProductionLifecycleSnapshot["canonicalItems"][number],
): string | undefined {
  return stringValue(
    asRecord(
      item.metadata.governance,
    )?.packageId,
  );
}

function authorityClassForCanonicalItem(
  item:
    KnowledgeProductionLifecycleSnapshot["canonicalItems"][number],
): string | undefined {
  return stringValue(
    item.metadata.authorityClass,
  );
}

export function createCanonicalKnowledgeProjection(
  snapshot:
    KnowledgeProductionLifecycleSnapshot,
): CanonicalKnowledgeProjection {
  const packageById =
    new Map(
      snapshot.packages.map(
        (knowledgePackage) => [
          knowledgePackage.id,
          knowledgePackage,
        ] as const,
      ),
    );

  const capsules =
    snapshot.canonicalItems.flatMap(
      (
        item,
      ): CanonicalKnowledgeProjectionItem[] => {
        const packageId =
          packageIdForCanonicalItem(
            item,
          );

        if (
          !packageId
        ) {
          return [];
        }

        const knowledgePackage =
          packageById.get(
            packageId,
          );

        if (
          !knowledgePackage ||
          (
            knowledgePackage.state !== "canonical" &&
            knowledgePackage.state !== "adapted"
          )
        ) {
          return [];
        }

        const governance =
          asRecord(
            item.metadata.governance,
          );

        const reviewerId =
          stringValue(
            governance?.reviewerId,
          );

        const reviewReason =
          stringValue(
            governance?.reviewReason,
          );

        const reviewedAt =
          typeof governance?.reviewedAt === "number"
            ? governance.reviewedAt
            : undefined;

        const supersedes =
          stringArray(
            governance?.supersedes,
          );

        const rationale:
          string[] = [];

        if (
          reviewerId
        ) {
          rationale.push(
            `Human canonical approval recorded by ${reviewerId}.`,
          );
        }

        if (
          reviewReason
        ) {
          rationale.push(
            reviewReason,
          );
        }

        if (
          reviewedAt
        ) {
          rationale.push(
            `Governed review completed ${new Date(
              reviewedAt,
            ).toLocaleDateString()}.`,
          );
        }

        if (
          rationale.length === 0
        ) {
          rationale.push(
            `Canonical authority is linked to ${packageId}.`,
          );
        }

        return [
          {
            id:
              item.id,

            displayId:
              packageId,

            capsuleId:
              packageId,

            title:
              item.title,

            collection:
              "Governed Canonical Knowledge",

            authority:
              knowledgePackage.authority ??
              stringValue(
                governance?.authority,
              ) ??
              "Unavailable",

            trust:
              authorityClassForCanonicalItem(
                item,
              ) ??
              "Canonical",

            scope:
              knowledgePackage.scope ??
              stringValue(
                governance?.scope,
              ) ??
              "Unavailable",

            version:
              knowledgePackage.version ??
              stringValue(
                governance?.packageVersion,
              ) ??
              "Unversioned",

            status:
              "Published",

            supersession:
              supersedes.length > 0
                ? `Replaces ${supersedes.join(", ")}`
                : "No supersession recorded",

            retirement:
              "Retirement schedule unavailable",

            rationale,
          },
        ];
      },
    );

  const constitutional =
    snapshot.canonicalItems.filter(
      (item) =>
        authorityClassForCanonicalItem(
          item,
        ) === "constitutional",
    ).length;

  const superseded =
    snapshot.packages.filter(
      (knowledgePackage) =>
        knowledgePackage.state ===
        "superseded",
    ).length;

  /*
   * Collection registry and retirement scheduling are
   * not yet exposed by the governed runtime.
   *
   * Preserve the certified three-card composition while
   * representing those capabilities truthfully as unavailable.
   */
  const collections:
    CanonicalKnowledgeCollectionProjection[] = [
      {
        title:
          "Collection registry unavailable",

        count:
          "—",

        authority:
          "Runtime authority unavailable",

        scope:
          "Not yet exposed",
      },
      {
        title:
          "Collection governance unavailable",

        count:
          "—",

        authority:
          "Runtime authority unavailable",

        scope:
          "Not yet exposed",
      },
      {
        title:
          "Collection lifecycle unavailable",

        count:
          "—",

        authority:
          "Runtime authority unavailable",

        scope:
          "Not yet exposed",
      },
    ];

  return {
    capsules,

    collections,

    metrics: {
      published:
        String(
          snapshot.summary
            .canonical,
        ),

      collections:
        "—",

      constitutional:
        String(
          constitutional,
        ),

      retiring:
        "—",

      supersessionActivity:
        String(
          superseded,
        ),

      superseded:
        `${superseded} capsules`,

      retirementScheduled:
        "Unavailable",
    },
  };
}

export const emptyCanonicalKnowledgeProjection:
  CanonicalKnowledgeProjection = {
    capsules:
      [],

    collections: [
      {
        title:
          "Collection registry unavailable",

        count:
          "—",

        authority:
          "Runtime authority unavailable",

        scope:
          "Not yet exposed",
      },
      {
        title:
          "Collection governance unavailable",

        count:
          "—",

        authority:
          "Runtime authority unavailable",

        scope:
          "Not yet exposed",
      },
      {
        title:
          "Collection lifecycle unavailable",

        count:
          "—",

        authority:
          "Runtime authority unavailable",

        scope:
          "Not yet exposed",
      },
    ],

    metrics: {
      published:
        "0",

      collections:
        "—",

      constitutional:
        "0",

      retiring:
        "—",

      supersessionActivity:
        "0",

      superseded:
        "0 capsules",

      retirementScheduled:
        "Unavailable",
    },
  };
