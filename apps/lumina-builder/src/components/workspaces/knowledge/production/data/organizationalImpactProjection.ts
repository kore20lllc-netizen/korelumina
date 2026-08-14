import type {
  KnowledgeCapsuleModel,
  KnowledgeDistributionRecord,
} from "../capsules";

export type OrganizationalImpactOutcome = {
  id: string;
  title: string;
  capsuleId: string;
  capsuleReference: string;
  mission: string;
  outcome: string;
  confidence: string;
  detail: string;
};

export type OrganizationalImpactLeverageSignal = {
  title: string;
  value: string;
  detail: string;
};

export type OrganizationalImpactReviewSignal = {
  title: string;
  detail: string;
  tone:
    | "amber"
    | "violet"
    | "rose";
};

export type OrganizationalImpactProjection = {
  canonicalAssetCount: number;
  activeConsumerCount: number;
  governedEvidenceEventCount: number;
  verifiedOutcomeCount: number;
  verifiedOutcomeRate: string;
  outcomes: OrganizationalImpactOutcome[];
  leverageSignals: OrganizationalImpactLeverageSignal[];
  reviewSignals: OrganizationalImpactReviewSignal[];
};

function isAvailable(
  value: string | undefined,
): value is string {
  if (!value) {
    return false;
  }

  const normalized =
    value.trim().toLowerCase();

  return (
    normalized.length > 0 &&
    normalized !== "unavailable" &&
    normalized !== "unknown" &&
    normalized !== "none"
  );
}

function isCanonical(
  capsule: KnowledgeCapsuleModel,
) {
  return (
    capsule.state === "published" ||
    capsule.state === "adapted" ||
    capsule.state === "consumed" ||
    capsule.stage === "Canonical Knowledge"
  );
}

function activeConsumers(
  record:
    | KnowledgeDistributionRecord
    | undefined,
) {
  return (
    record?.consumers.filter(
      (consumer) =>
        consumer.status ===
          "connected" ||
        consumer.status ===
          "consuming",
    ) ?? []
  );
}

function capsuleReference(
  capsule: KnowledgeCapsuleModel,
) {
  return (
    capsule.identity ||
    capsule.id
  );
}

export function createOrganizationalImpactProjection(
  capsules: KnowledgeCapsuleModel[],
  records: KnowledgeDistributionRecord[],
): OrganizationalImpactProjection {
  const recordByCapsuleId =
    new Map(
      records.map(
        (record) => [
          record.capsuleId,
          record,
        ],
      ),
    );

  const canonicalCapsules =
    capsules.filter(
      isCanonical,
    );

  const activeConsumerCount =
    records.reduce(
      (
        total,
        record,
      ) =>
        total +
        activeConsumers(
          record,
        ).length,
      0,
    );

  const governedEvidenceEventCount =
    records.reduce(
      (
        total,
        record,
      ) =>
        total +
        record.history.length,
      0,
    );

  /*
   * An Impact outcome is only considered verified when runtime
   * exposes both governed downstream adoption and persisted
   * evidence history for the same canonical capsule.
   *
   * We deliberately do not infer percentage improvements,
   * financial value, risk reduction, or operational performance
   * that runtime has not actually persisted.
   */
  const outcomes =
    canonicalCapsules
      .flatMap(
        (
          capsule,
        ):
          OrganizationalImpactOutcome[] => {
          const record =
            recordByCapsuleId.get(
              capsule.id,
            );

          const consumers =
            activeConsumers(
              record,
            );

          const eventCount =
            record?.history.length ??
            0;

          if (
            consumers.length === 0 ||
            eventCount === 0
          ) {
            return [];
          }

          const mission =
            isAvailable(
              capsule.mission,
            )
              ? capsule.mission
              : "Governed knowledge";

          return [
            {
              id:
                `impact-${capsule.id}`,

              title:
                `${mission} knowledge adoption`,

              capsuleId:
                capsule.id,

              capsuleReference:
                capsuleReference(
                  capsule,
                ),

              mission,

              outcome:
                `${consumers.length} active consumer${
                  consumers.length === 1
                    ? ""
                    : "s"
                } with ${eventCount} governed evidence event${
                  eventCount === 1
                    ? ""
                    : "s"
                }`,

              confidence:
                "Persisted evidence",

              detail:
                `Canonical knowledge is actively consumed by ${consumers
                  .map(
                    (
                      consumer,
                    ) =>
                      consumer.label,
                  )
                  .join(
                    ", ",
                  )}.`,
            },
          ];
        },
      )
      .slice(
        0,
        3,
      );

  const verifiedOutcomeCount =
    outcomes.length;

  const verifiedOutcomeRate =
    canonicalCapsules.length > 0
      ? `${Math.round(
          (
            verifiedOutcomeCount /
            canonicalCapsules.length
          ) *
            100,
        )}%`
      : "0%";

  const missionCount =
    new Set(
      canonicalCapsules
        .map(
          (
            capsule,
          ) =>
            capsule.mission,
        )
        .filter(
          isAvailable,
        ),
    ).size;

  const evidenceCoveredCapsules =
    canonicalCapsules.filter(
      (
        capsule,
      ) =>
        (
          recordByCapsuleId.get(
            capsule.id,
          )?.history.length ??
          0
        ) > 0,
    ).length;

  const evidenceCoverage =
    canonicalCapsules.length > 0
      ? Math.round(
          (
            evidenceCoveredCapsules /
            canonicalCapsules.length
          ) *
            100,
        )
      : 0;

  const lowConsumptionCount =
    canonicalCapsules.filter(
      (
        capsule,
      ) =>
        activeConsumers(
          recordByCapsuleId.get(
            capsule.id,
          ),
        ).length === 0,
    ).length;

  const incompleteEvidenceCount =
    canonicalCapsules.filter(
      (
        capsule,
      ) =>
        (
          recordByCapsuleId.get(
            capsule.id,
          )?.history.length ??
          0
        ) === 0,
    ).length;

  const supersededCount =
    capsules.filter(
      (
        capsule,
      ) =>
        capsule.state ===
        "superseded",
    ).length;

  return {
    canonicalAssetCount:
      canonicalCapsules.length,

    activeConsumerCount,

    governedEvidenceEventCount,

    verifiedOutcomeCount,

    verifiedOutcomeRate,

    outcomes,

    leverageSignals: [
      {
        title:
          "Governed reuse",
        value:
          String(
            activeConsumerCount,
          ),
        detail:
          "Active governed consumer relationships observed across canonical knowledge.",
      },
      {
        title:
          "Mission reach",
        value:
          String(
            missionCount,
          ),
        detail:
          "Distinct persisted missions represented by canonical knowledge.",
      },
      {
        title:
          "Evidence coverage",
        value:
          `${evidenceCoverage}%`,
        detail:
          "Canonical assets with persisted downstream evidence events.",
      },
    ],

    reviewSignals: [
      {
        title:
          "Impact evidence incomplete",
        detail:
          `${incompleteEvidenceCount} canonical asset${
            incompleteEvidenceCount === 1
              ? ""
              : "s"
          } currently lack persisted downstream outcome evidence.`,
        tone:
          "amber",
      },
      {
        title:
          "Low-consumption authority",
        detail:
          `${lowConsumptionCount} canonical asset${
            lowConsumptionCount === 1
              ? ""
              : "s"
          } currently have no active governed consumer.`,
        tone:
          "violet",
      },
      {
        title:
          "Retirement review candidates",
        detail:
          `${supersededCount} superseded knowledge asset${
            supersededCount === 1
              ? ""
              : "s"
          } currently require value-retention review.`,
        tone:
          "rose",
      },
    ],
  };
}
