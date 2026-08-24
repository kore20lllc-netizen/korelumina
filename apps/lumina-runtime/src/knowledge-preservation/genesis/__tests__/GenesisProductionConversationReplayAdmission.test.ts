import assert from "node:assert/strict";
import test from "node:test";

import {
  createKnowledgePreservationPlatform,
} from "../../bootstrap/index.js";

import {
  GenesisProductionReplayAdmissionAdapter,
} from "../GenesisProductionReplayAdmissionAdapter.js";

import {
  createGenesisReplayAdmissionIdentity,
} from "../GenesisReplayAdmission.js";

import type {
  GenesisReplayAdmissionRequest,
} from "../GenesisReplayExecution.js";


function request():
  GenesisReplayAdmissionRequest {
  const historicalSourceId =
    "genesis-historical-source:conversation:test" as
      GenesisReplayAdmissionRequest[
        "manifestEntry"
      ]["historicalSourceId"];

  const result:
    GenesisReplayAdmissionRequest = {
    replayId:
      "genesis-replay:test" as
        GenesisReplayAdmissionRequest[
          "replayId"
        ],

    manifestId:
      "genesis-source-manifest:test",

    repository:
      "korelumina",

    manifestIndex:
      0,

    planEntry: {
      manifestIndex:
        0,

      historicalSourceId,

      sourceChecksum:
        "checksum-001",

      action:
        "ADMIT",
    },

    manifestEntry: {
      historicalSourceId,

      evidenceType:
        "conversation",

      sourceType:
        "conversation",

      sourceChecksum:
        "checksum-001",

      provenanceLocator:
        "chatgpt://conversation-001/message-001",

      historicalTimestamp:
        100,

      historicalTimestampSource:
        "conversation",

      discoveredAt:
        200,

      discoveryMethod:
        "chatgpt-export",

      authorityClass:
        "external-conversation-evidence",

      authorityOwner:
        "chatgpt",

      authorityScope:
        "korelumina",

      authorityVersion:
        "1",

      replayEligibility:
        "eligible",

      supersedes:
        [],

      conflictsWith:
        [],

      metadata: {
        conversationId:
          "conversation-001",
      },
    },

    admissionIdentity:
      "genesis-admission:pending" as
        GenesisReplayAdmissionRequest[
          "admissionIdentity"
        ],

    executionTimestamp:
      300,
  };

  result.admissionIdentity =
    createGenesisReplayAdmissionIdentity(
      result,
    );

  return result;
}


test(
  "conversation replay preserves original acquired Evidence identity and payload",
  async () => {
    const input =
      request();

    const originalEvidence = {
      id:
        "conversation-evidence-original",

      type:
        "conversation" as const,

      title:
        "Original conversation",

      source:
        "chatgpt",

      capturedAt:
        200,

      observedAt:
        100,

      contentRef:
        input.manifestEntry
          .provenanceLocator,

      checksum:
        input.manifestEntry
          .sourceChecksum,

      metadata: {
        historicalSourceId:
          input.manifestEntry
            .historicalSourceId,

        content:
          "Original acquired payload.",
      },

      relationships: {
        historicalSource: [
          input.manifestEntry
            .historicalSourceId,
        ],
      },
    };

    const platform =
      createKnowledgePreservationPlatform();

    const adapter =
      new GenesisProductionReplayAdmissionAdapter({
        platform,

        conversationEvidenceResolver: {
          resolve:
            () =>
              originalEvidence,
        },
      });

    const result =
      await adapter.admit(
        input,
      );

    assert.equal(
      result.evidenceId,
      originalEvidence.id,
    );

    /*
     * Conversation governance currently requires review and must
     * not automatically invoke Knowledge manufacturing.
     */
    assert.equal(
      platform
        .manufacturingRunService
        .list()
        .length,
      0,
    );
  },
);


test(
  "conversation replay fails closed when acquired Evidence is unavailable",
  async () => {
    const adapter =
      new GenesisProductionReplayAdmissionAdapter({
        platform:
          createKnowledgePreservationPlatform(),

        conversationEvidenceResolver: {
          resolve:
            () =>
              null,
        },
      });

    await assert.rejects(
      () =>
        adapter.admit(
          request(),
        ),
      /conversation_replay_evidence_missing/,
    );
  },
);


test(
  "conversation replay rejects checksum drift from acquisition custody",
  async () => {
    const input =
      request();

    const adapter =
      new GenesisProductionReplayAdmissionAdapter({
        platform:
          createKnowledgePreservationPlatform(),

        conversationEvidenceResolver: {
          resolve:
            () => ({
              id:
                "conversation-evidence-original",

              type:
                "conversation",

              title:
                "Conversation",

              source:
                "chatgpt",

              capturedAt:
                200,

              observedAt:
                100,

              contentRef:
                input.manifestEntry
                  .provenanceLocator,

              checksum:
                "different-checksum",

              metadata: {
                historicalSourceId:
                  input.manifestEntry
                    .historicalSourceId,

                content:
                  "Payload.",
              },

              relationships:
                {},
            }),
        },
      });

    await assert.rejects(
      () =>
        adapter.admit(
          input,
        ),
      /conversation_replay_evidence_checksum_mismatch/,
    );
  },
);
