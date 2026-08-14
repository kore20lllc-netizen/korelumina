import type {
  ConsumerStatus,
  KnowledgeCapsuleModel,
  KnowledgeDistributionRecord,
} from "../capsules";

export type KnowledgeDistributionProjection = {
  records: KnowledgeDistributionRecord[];
};

export const emptyKnowledgeDistributionProjection:
  KnowledgeDistributionProjection = {
    records: [],
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

function consumerStatusForCapsule(
  capsule: KnowledgeCapsuleModel,
): ConsumerStatus {
  switch (capsule.state) {
    case "consumed":
      return "consuming";

    case "published":
    case "adapted":
      return "connected";

    case "superseded":
      return "superseded";

    case "archived":
      return "archived";

    case "blocked":
    case "failed":
      return "restricted";

    case "waiting":
      return "waiting";

    default:
      return "pending";
  }
}

function consumerIdFromLabel(
  label: string,
) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createRecord(
  capsule: KnowledgeCapsuleModel,
): KnowledgeDistributionRecord {
  const consumers =
    isAvailable(
      capsule.consumer,
    )
      ? [
          {
            id:
              consumerIdFromLabel(
                capsule.consumer,
              ),
            label:
              capsule.consumer,
            status:
              consumerStatusForCapsule(
                capsule,
              ),
            detail:
              isAvailable(
                capsule.destination,
              )
                ? `Governed destination: ${capsule.destination}.`
                : "No persisted destination detail is currently available.",
          },
        ]
      : [];

  return {
    capsuleId:
      capsule.id,

    consumers,

    /*
     * Consumption history must only represent persisted evidence.
     * The lifecycle capsule projection currently exposes no
     * consumption-event ledger, so this remains truthfully empty.
     */
    history: [],

    genealogy: {
      /*
       * The lifecycle model currently does not expose explicit
       * parent/child/sibling capsule relationships.
       */
      parentCapsuleIds: [],
      childCapsuleIds: [],
      siblingCapsuleIds: [],

      relatedArtifacts:
        capsule.sources.filter(
          isAvailable,
        ),

      relatedConversations: [],

      relatedMissions:
        isAvailable(
          capsule.mission,
        )
          ? [
              capsule.mission,
            ]
          : [],

      educationalInfluence:
        isAvailable(
          capsule.educationalModule,
        )
          ? [
              capsule.educationalModule,
            ]
          : [],

      /*
       * Organizational influence requires persisted evidence
       * beyond the capsule lifecycle record.
       */
      organizationalInfluence: [],
    },
  };
}

export function createKnowledgeDistributionProjection(
  capsules: KnowledgeCapsuleModel[],
): KnowledgeDistributionProjection {
  return {
    records:
      capsules.map(
        createRecord,
      ),
  };
}
