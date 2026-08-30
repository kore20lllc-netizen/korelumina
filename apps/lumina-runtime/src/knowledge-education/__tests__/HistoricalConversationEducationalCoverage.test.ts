import assert from "node:assert/strict";
import test from "node:test";

import type {
  EvidenceItem,
} from "../../knowledge-preservation/evidence/index.js";

import type {
  EducationalCorpusHistoricalEvidence,
  EducationalCorpusHistoricalEvidenceRecord,
} from "../EducationalCorpusHistoricalEvidence.js";

import {
  measureHistoricalConversationEducationalCoverage,
} from "../HistoricalConversationEducationalCoverage.js";


function conversationRecord(
  input: {
    suffix:
      string;

    historicalSourceId:
      string;

    messageId:
      string;

    governingAuthority?:
      false;
  },
): EducationalCorpusHistoricalEvidenceRecord {
  return {
    evidenceRecordId:
      `educational-corpus-historical-evidence-record:${input.suffix}`,

    recordId:
      `genesis-historical-education:${input.suffix}`,

    replayId:
      "genesis-replay:test",

    episodeId:
      `genesis-episode:${input.suffix}`,

    episodeRevisionId:
      `genesis-episode-revision:${input.suffix}`,

    episodeKey:
      `conversation:${input.suffix}`,

    title:
      `Historical correlation · ${input.historicalSourceId}`,

    lifecycle:
      "validated",

    externalContext:
      "complete",

    learningRole:
      "HISTORICAL_CONTEXT",

    temporalAuthority: {
      historicalStatus:
        "historically-observed",

      currentStatus:
        "unknown",

      historicalAuthorityClass:
        "external-conversation-evidence",

      historicalApprovalState:
        null,

      currentAuthorityClass:
        "external-conversation-evidence",

      currentApprovalState:
        null,

      replacedBy:
        null,
    },

    eventReferences: [
      {
        eventId:
          `genesis-event:${input.suffix}`,

        kind:
          "other",

        occurredAt:
          100,

        summary:
          null,
      },
    ],

    sourceReferences: [
      {
        sourceReferenceId:
          `genesis-source-ref:${input.suffix}`,

        sourceRevisionId:
          `genesis-source-revision:${input.suffix}`,

        sourceIdentity:
          input.historicalSourceId,

        sourceClass:
          "conversation",

        evidenceType:
          "conversation",

        acquisitionState:
          "acquired",

        provenance: {
          nativeId:
            input.messageId,

          externalSource:
            true,
        },
      },
    ],

    relationshipIds:
      [],

    lineage: {
      previousRevisionId:
        null,

      mergedFrom:
        [],

      splitFrom:
        null,

      supersedes:
        [],
    },

    assessment: {
      policyVersion:
        "genesis-historical-education-source-assessment:v1",

      decision:
        "ELIGIBLE_HISTORICAL_EVIDENCE",

      reasons: [
        "certified-genesis-historical-provenance-present",
      ],
    },

    governingAuthority:
      input.governingAuthority ??
      false,

    educationalCorpusCertified:
      false,

    initialCompetencyCertified:
      false,

    chiefAgentActivationAuthorized:
      false,
  };
}


function repositoryRecord(
  suffix:
    string,
): EducationalCorpusHistoricalEvidenceRecord {
  const record =
    conversationRecord({
      suffix,
      historicalSourceId:
        `historical-source:${suffix}`,
      messageId:
        `message:${suffix}`,
    });

  return {
    ...record,

    sourceReferences:
      record.sourceReferences.map(
        source => ({
          ...source,

          sourceClass:
            "repository",

          evidenceType:
            "document",

          provenance: {
            ...source.provenance,

            externalSource:
              false,
          },
        }),
      ),
  };
}


function historicalEvidence(
  records:
    readonly EducationalCorpusHistoricalEvidenceRecord[],
): EducationalCorpusHistoricalEvidence {
  return {
    historicalEvidenceId:
      "educational-corpus-historical-evidence:test",

    version:
      "educational-corpus-historical-evidence:v1",

    records,

    summary: {
      assessedRecords:
        records.length,

      eligibleRecords:
        records.length,

      blockedRecords:
        0,

      byLearningRole: {
        HISTORICAL_CONTEXT:
          records.length,
      },
    },

    governingAuthority:
      false,

    educationalCorpusCertified:
      false,

    initialCompetencyCertified:
      false,

    chiefAgentActivationAuthorized:
      false,
  };
}


function conversationEvidence(
  input: {
    suffix:
      string;

    historicalSourceId:
      string;

    conversationId:
      string;

    messageId:
      string;

    title:
      string;
  },
): EvidenceItem {
  return {
    id:
      `genesis-conversation-evidence:${input.suffix}`,

    type:
      "conversation",

    title:
      input.title,

    source:
      "chatgpt-data-export",

    capturedAt:
      200,

    observedAt:
      100,

    contentRef:
      `chatgpt-export://conversations.json#conversation=${input.conversationId}&message=${input.messageId}`,

    checksum:
      `checksum:${input.suffix}`,

    metadata: {
      historicalSourceId:
        input.historicalSourceId,

      conversationId:
        input.conversationId,

      messageId:
        input.messageId,

      content:
        "Historical conversation content",
    },

    relationships: {
      historicalSource: [
        input.historicalSourceId,
      ],

      conversation: [
        input.conversationId,
      ],
    },
  };
}


test(
  "historical conversation coverage maps the existing governed conversation-title signal to all certified conversation curriculum requirements",
  () => {
    const topics = [
      [
        "architecture",
        "conversation:architecture",
      ],
      [
        "governance",
        "conversation:governance",
      ],
      [
        "engineering",
        "conversation:engineering",
      ],
      [
        "mission",
        "conversation:mission",
      ],
      [
        "operations",
        "conversation:operations",
      ],
    ] as const;

    const records =
      topics.map(
        (
          [
            topic,
          ],
        ) =>
          conversationRecord({
            suffix:
              topic,

            historicalSourceId:
              `historical-source:${topic}`,

            messageId:
              `message:${topic}`,
          }),
      );

    const evidence =
      topics.map(
        (
          [
            topic,
          ],
        ) =>
          conversationEvidence({
            suffix:
              topic,

            historicalSourceId:
              `historical-source:${topic}`,

            conversationId:
              `conversation:${topic}`,

            messageId:
              `message:${topic}`,

            title:
              `KoreLumina ${topic} discussion — message 0`,
          }),
      );

    const result =
      measureHistoricalConversationEducationalCoverage({
        historicalEvidence:
          historicalEvidence(
            records,
          ),

        conversationEvidence:
          evidence,
      });

    assert.deepEqual(
      result.satisfiedRequirements,
      topics
        .map(
          (
            [
              ,
              requirementId,
            ],
          ) =>
            requirementId,
        )
        .sort(),
    );

    assert.deepEqual(
      result.missingRequirements,
      [],
    );

    assert.equal(
      result.satisfiedCount,
      5,
    );

    assert.equal(
      result.requirementCount,
      5,
    );

    assert.equal(
      result.completion,
      100,
    );

    assert.equal(
      result.complete,
      true,
    );

    assert.equal(
      result.governingAuthority,
      false,
    );

    assert.equal(
      result.contributors.length,
      5,
    );

    for (
      const contributor
      of result.contributors
    ) {
      assert.ok(
        contributor.evidenceId.startsWith(
          "genesis-conversation-evidence:",
        ),
      );

      assert.ok(
        contributor.historicalSourceId.startsWith(
          "historical-source:",
        ),
      );

      assert.equal(
        contributor.recordIds.length,
        1,
      );

      assert.equal(
        contributor.episodeIds.length,
        1,
      );

      assert.equal(
        contributor.sourceReferenceIds.length,
        1,
      );

      assert.equal(
        contributor.sourceRevisionIds.length,
        1,
      );

      assert.equal(
        contributor.eventIds.length,
        1,
      );
    }
  },
);


test(
  "historical conversation coverage ignores non-conversation and unjoined historical material and reports missing requirements",
  () => {
    const architectureRecord =
      conversationRecord({
        suffix:
          "architecture",

        historicalSourceId:
          "historical-source:architecture",

        messageId:
          "message:architecture",
      });

    const result =
      measureHistoricalConversationEducationalCoverage({
        historicalEvidence:
          historicalEvidence([
            architectureRecord,
            repositoryRecord(
              "repository",
            ),
            conversationRecord({
              suffix:
                "missing-evidence",

              historicalSourceId:
                "historical-source:missing",

              messageId:
                "message:missing",
            }),
          ]),

        conversationEvidence: [
          conversationEvidence({
            suffix:
              "architecture",

            historicalSourceId:
              "historical-source:architecture",

            conversationId:
              "conversation:architecture",

            messageId:
              "message:architecture",

            title:
              "Architecture review — message 0",
          }),

          {
            ...conversationEvidence({
              suffix:
                "not-conversation",

              historicalSourceId:
                "historical-source:repository",

              conversationId:
                "conversation:repository",

              messageId:
                "message:repository",

              title:
                "Governance review",
            }),

            type:
              "document",
          },
        ],
      });

    assert.deepEqual(
      result.satisfiedRequirements,
      [
        "conversation:architecture",
      ],
    );

    assert.deepEqual(
      result.missingRequirements,
      [
        "conversation:engineering",
        "conversation:governance",
        "conversation:mission",
        "conversation:operations",
      ],
    );

    assert.equal(
      result.contributors.length,
      1,
    );

    assert.equal(
      result.governingAuthority,
      false,
    );
  },
);


test(
  "historical conversation coverage deduplicates repeated evidence and overlapping episodes and is deterministic",
  () => {
    const firstRecord =
      conversationRecord({
        suffix:
          "governance-a",

        historicalSourceId:
          "historical-source:governance",

        messageId:
          "message:governance",
      });

    const secondRecord =
      conversationRecord({
        suffix:
          "governance-b",

        historicalSourceId:
          "historical-source:governance",

        messageId:
          "message:governance",
      });

    const evidence =
      conversationEvidence({
        suffix:
          "governance",

        historicalSourceId:
          "historical-source:governance",

        conversationId:
          "conversation:governance",

        messageId:
          "message:governance",

        title:
          "Governance evolution discussion — message 0",
      });

    const inputA = {
      historicalEvidence:
        historicalEvidence([
          secondRecord,
          firstRecord,
          firstRecord,
        ]),

      conversationEvidence: [
        evidence,
        evidence,
      ],
    };

    const inputB = {
      historicalEvidence:
        historicalEvidence([
          firstRecord,
          secondRecord,
        ]),

      conversationEvidence: [
        evidence,
      ],
    };

    const first =
      measureHistoricalConversationEducationalCoverage(
        inputA,
      );

    const second =
      measureHistoricalConversationEducationalCoverage(
        inputB,
      );

    assert.deepEqual(
      first,
      second,
    );

    assert.deepEqual(
      first.satisfiedRequirements,
      [
        "conversation:governance",
      ],
    );

    assert.equal(
      first.contributors.length,
      1,
    );

    assert.deepEqual(
      first.contributors[0]
        ?.recordIds,
      [
        "genesis-historical-education:governance-a",
        "genesis-historical-education:governance-b",
      ],
    );

    assert.deepEqual(
      first.contributors[0]
        ?.episodeIds,
      [
        "genesis-episode:governance-a",
        "genesis-episode:governance-b",
      ],
    );

    assert.equal(
      first.governingAuthority,
      false,
    );
  },
);
