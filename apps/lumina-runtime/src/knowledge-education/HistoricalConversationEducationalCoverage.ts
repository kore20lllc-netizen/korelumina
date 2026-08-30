import type {
  EvidenceItem,
} from "../knowledge-preservation/evidence/index.js";

import type {
  EducationalCorpusHistoricalEvidence,
  EducationalCorpusHistoricalEvidenceRecord,
} from "./EducationalCorpusHistoricalEvidence.js";

import {
  coverageRequirementsForModule,
} from "./measurement/index.js";

import type {
  EducationalCoverageRequirement,
} from "./measurement/EducationalCoverageEngine.js";


export const HISTORICAL_CONVERSATION_EDUCATIONAL_COVERAGE_VERSION =
  "historical-conversation-educational-coverage:v1" as const;


export const HISTORICAL_CONVERSATION_EDUCATIONAL_MODULE_ID =
  "conversation-curriculum" as const;


export interface HistoricalConversationEducationalCoverageContributor {
  requirementId:
    string;

  evidenceId:
    string;

  evidenceTitle:
    string;

  historicalSourceId:
    string;

  conversationId:
    string;

  messageId:
    string;

  recordIds:
    readonly string[];

  episodeIds:
    readonly string[];

  sourceReferenceIds:
    readonly string[];

  sourceRevisionIds:
    readonly string[];

  eventIds:
    readonly string[];
}


export interface HistoricalConversationEducationalCoverageResult {
  version:
    typeof HISTORICAL_CONVERSATION_EDUCATIONAL_COVERAGE_VERSION;

  moduleId:
    typeof HISTORICAL_CONVERSATION_EDUCATIONAL_MODULE_ID;

  satisfiedRequirements:
    readonly string[];

  missingRequirements:
    readonly string[];

  contributors:
    readonly HistoricalConversationEducationalCoverageContributor[];

  satisfiedCount:
    number;

  requirementCount:
    number;

  completion:
    number;

  complete:
    boolean;

  /*
   * Historical conversation coverage is evidence of Day-0
   * educational completeness only.
   *
   * It does not create current governing curriculum authority.
   */
  governingAuthority:
    false;
}


interface MutableContributor {
  requirementId:
    string;

  evidenceId:
    string;

  evidenceTitle:
    string;

  historicalSourceId:
    string;

  conversationId:
    string;

  messageId:
    string;

  recordIds:
    Set<string>;

  episodeIds:
    Set<string>;

  sourceReferenceIds:
    Set<string>;

  sourceRevisionIds:
    Set<string>;

  eventIds:
    Set<string>;
}


function normalize(
  value:
    string,
): string {
  return value
    .trim()
    .toLowerCase();
}


function metadataString(
  evidence:
    EvidenceItem,
  key:
    string,
): string | null {
  const value =
    evidence.metadata[
      key
    ];

  if (
    typeof value !==
      "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length >
    0
    ? normalized
    : null;
}


function sortedUnique(
  values:
    readonly string[],
): readonly string[] {
  return [
    ...new Set(
      values,
    ),
  ].sort();
}


function conversationRequirements():
  readonly EducationalCoverageRequirement[] {
  const requirements =
    coverageRequirementsForModule(
      HISTORICAL_CONVERSATION_EDUCATIONAL_MODULE_ID,
    );

  if (
    requirements.length ===
      0
  ) {
    throw new Error(
      "historical_conversation_coverage_requirements_missing",
    );
  }

  for (
    const requirement
    of requirements
  ) {
    const kinds =
      requirement.match
        .kinds ??
      [];

    const titleIncludes =
      requirement.match
        .titleIncludes ??
      [];

    /*
     * k134 intentionally consumes the existing governed conversation
     * coverage contract. It does not invent another topic registry or
     * broaden matching beyond the already-certified title signal.
     */
    if (
      !kinds.includes(
        "conversation",
      ) ||
      titleIncludes.length ===
        0
    ) {
      throw new Error(
        `historical_conversation_coverage_requirement_contract_unsupported:${requirement.id}`,
      );
    }
  }

  return requirements;
}


function evidenceSatisfiesRequirement(
  evidence:
    EvidenceItem,
  requirement:
    EducationalCoverageRequirement,
): boolean {
  if (
    evidence.type !==
      "conversation"
  ) {
    return false;
  }

  const kinds =
    requirement.match
      .kinds ??
    [];

  if (
    kinds.length >
      0 &&
    !kinds.includes(
      evidence.type,
    )
  ) {
    return false;
  }

  const titleIncludes =
    requirement.match
      .titleIncludes ??
    [];

  if (
    titleIncludes.length ===
      0
  ) {
    return false;
  }

  const title =
    normalize(
      evidence.title,
    );

  return titleIncludes.some(
    needle =>
      title.includes(
        normalize(
          needle,
        ),
      ),
  );
}


function conversationSources(
  record:
    EducationalCorpusHistoricalEvidenceRecord,
) {
  return record
    .sourceReferences
    .filter(
      source =>
        source.sourceClass ===
          "conversation" &&
        source.evidenceType ===
          "conversation",
    )
    .sort(
      (
        left,
        right,
      ) =>
        left.sourceReferenceId.localeCompare(
          right.sourceReferenceId,
        ),
    );
}


function evidenceByHistoricalSource(
  evidence:
    readonly EvidenceItem[],
): ReadonlyMap<
  string,
  readonly EvidenceItem[]
> {
  const bySource =
    new Map<
      string,
      Map<
        string,
        EvidenceItem
      >
    >();

  for (
    const item
    of evidence
  ) {
    if (
      item.type !==
        "conversation"
    ) {
      continue;
    }

    const historicalSourceId =
      metadataString(
        item,
        "historicalSourceId",
      );

    if (
      !historicalSourceId
    ) {
      continue;
    }

    let byEvidenceId =
      bySource.get(
        historicalSourceId,
      );

    if (
      !byEvidenceId
    ) {
      byEvidenceId =
        new Map();

      bySource.set(
        historicalSourceId,
        byEvidenceId,
      );
    }

    const existing =
      byEvidenceId.get(
        item.id,
      );

    if (
      existing
    ) {
      /*
       * Identical replay inputs may contain the same persisted Evidence
       * more than once. That must not change coverage.
       *
       * Conflicting reuse of an Evidence identity fails closed.
       */
      if (
        existing.title !==
          item.title ||
        existing.checksum !==
          item.checksum ||
        existing.contentRef !==
          item.contentRef
      ) {
        throw new Error(
          `historical_conversation_coverage_conflicting_evidence_identity:${item.id}`,
        );
      }

      continue;
    }

    byEvidenceId.set(
      item.id,
      item,
    );
  }

  return new Map(
    [
      ...bySource.entries(),
    ]
      .sort(
        (
          [left],
          [right],
        ) =>
          left.localeCompare(
            right,
          ),
      )
      .map(
        (
          [
            sourceId,
            byEvidenceId,
          ],
        ) => [
          sourceId,
          [
            ...byEvidenceId.values(),
          ].sort(
            (
              left,
              right,
            ) =>
              left.id.localeCompare(
                right.id,
              ),
          ),
        ],
      ),
  );
}


function contributorKey(
  requirementId:
    string,
  evidenceId:
    string,
  historicalSourceId:
    string,
): string {
  return [
    requirementId,
    evidenceId,
    historicalSourceId,
  ].join(
    "\u0000",
  );
}


export function measureHistoricalConversationEducationalCoverage(
  input: {
    historicalEvidence:
      EducationalCorpusHistoricalEvidence;

    conversationEvidence:
      readonly EvidenceItem[];
  },
): HistoricalConversationEducationalCoverageResult {
  if (
    input.historicalEvidence
      .governingAuthority !==
    false
  ) {
    throw new Error(
      "historical_conversation_coverage_governing_authority_invalid",
    );
  }

  const requirements =
    conversationRequirements();

  const evidenceBySource =
    evidenceByHistoricalSource(
      input.conversationEvidence,
    );

  const contributors =
    new Map<
      string,
      MutableContributor
    >();

  const records =
    [
      ...input.historicalEvidence.records,
    ].sort(
      (
        left,
        right,
      ) =>
        left.recordId.localeCompare(
          right.recordId,
        ),
    );

  for (
    const record
    of records
  ) {
    if (
      record.governingAuthority !==
        false ||
      record.assessment
        .decision !==
        "ELIGIBLE_HISTORICAL_EVIDENCE"
    ) {
      continue;
    }

    for (
      const source
      of conversationSources(
        record,
      )
    ) {
      /*
       * GenesisHistoricalCorrelationMaterializer uses the deterministic
       * Historical Source identity as sourceIdentity when no separate
       * logical sourceIdentity is supplied. Conversation acquisition
       * stores the same identity on persisted Evidence metadata.
       */
      const historicalSourceId =
        source.sourceIdentity;

      const candidates =
        evidenceBySource.get(
          historicalSourceId,
        ) ??
        [];

      for (
        const evidence
        of candidates
      ) {
        const conversationId =
          metadataString(
            evidence,
            "conversationId",
          );

        const messageId =
          metadataString(
            evidence,
            "messageId",
          );

        if (
          !conversationId ||
          !messageId
        ) {
          continue;
        }

        if (
          source.provenance
            .nativeId &&
          source.provenance
            .nativeId !==
            messageId
        ) {
          continue;
        }

        for (
          const requirement
          of requirements
        ) {
          if (
            !evidenceSatisfiesRequirement(
              evidence,
              requirement,
            )
          ) {
            continue;
          }

          const key =
            contributorKey(
              requirement.id,
              evidence.id,
              historicalSourceId,
            );

          let contributor =
            contributors.get(
              key,
            );

          if (
            !contributor
          ) {
            contributor = {
              requirementId:
                requirement.id,

              evidenceId:
                evidence.id,

              evidenceTitle:
                evidence.title,

              historicalSourceId,

              conversationId,

              messageId,

              recordIds:
                new Set(),

              episodeIds:
                new Set(),

              sourceReferenceIds:
                new Set(),

              sourceRevisionIds:
                new Set(),

              eventIds:
                new Set(),
            };

            contributors.set(
              key,
              contributor,
            );
          }

          contributor.recordIds.add(
            record.recordId,
          );

          contributor.episodeIds.add(
            record.episodeId,
          );

          contributor.sourceReferenceIds.add(
            source.sourceReferenceId,
          );

          contributor.sourceRevisionIds.add(
            source.sourceRevisionId,
          );

          for (
            const event
            of record.eventReferences
          ) {
            contributor.eventIds.add(
              event.eventId,
            );
          }
        }
      }
    }
  }

  const finalizedContributors =
    [
      ...contributors.values(),
    ]
      .map(
        contributor => ({
          requirementId:
            contributor.requirementId,

          evidenceId:
            contributor.evidenceId,

          evidenceTitle:
            contributor.evidenceTitle,

          historicalSourceId:
            contributor.historicalSourceId,

          conversationId:
            contributor.conversationId,

          messageId:
            contributor.messageId,

          recordIds:
            sortedUnique(
              [
                ...contributor.recordIds,
              ],
            ),

          episodeIds:
            sortedUnique(
              [
                ...contributor.episodeIds,
              ],
            ),

          sourceReferenceIds:
            sortedUnique(
              [
                ...contributor.sourceReferenceIds,
              ],
            ),

          sourceRevisionIds:
            sortedUnique(
              [
                ...contributor.sourceRevisionIds,
              ],
            ),

          eventIds:
            sortedUnique(
              [
                ...contributor.eventIds,
              ],
            ),
        }),
      )
      .sort(
        (
          left,
          right,
        ) =>
          left.requirementId.localeCompare(
            right.requirementId,
          ) ||
          left.evidenceId.localeCompare(
            right.evidenceId,
          ) ||
          left.historicalSourceId.localeCompare(
            right.historicalSourceId,
          ),
      );

  const satisfiedRequirements =
    sortedUnique(
      finalizedContributors.map(
        contributor =>
          contributor.requirementId,
      ),
    );

  const satisfied =
    new Set(
      satisfiedRequirements,
    );

  const allRequirementIds =
    requirements
      .map(
        requirement =>
          requirement.id,
      )
      .sort();

  const missingRequirements =
    allRequirementIds.filter(
      requirementId =>
        !satisfied.has(
          requirementId,
        ),
    );

  const satisfiedCount =
    satisfiedRequirements.length;

  const requirementCount =
    allRequirementIds.length;

  const completion =
    requirementCount ===
      0
      ? 0
      : Math.round(
          (
            satisfiedCount /
            requirementCount
          ) *
            100,
        );

  return {
    version:
      HISTORICAL_CONVERSATION_EDUCATIONAL_COVERAGE_VERSION,

    moduleId:
      HISTORICAL_CONVERSATION_EDUCATIONAL_MODULE_ID,

    satisfiedRequirements,

    missingRequirements,

    contributors:
      finalizedContributors,

    satisfiedCount,

    requirementCount,

    completion,

    complete:
      requirementCount >
        0 &&
      missingRequirements.length ===
        0,

    governingAuthority:
      false,
  };
}
