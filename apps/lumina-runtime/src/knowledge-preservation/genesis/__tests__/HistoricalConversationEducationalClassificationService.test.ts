import assert from "node:assert/strict";
import {
  mkdtemp,
  rm,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import type {
  EvidenceItem,
} from "../../evidence/EvidenceItem.js";

import type {
  EvidencePersistenceStore,
} from "../../evidence/EvidencePersistenceStore.js";

import {
  HistoricalConversationEducationalClassificationPersistence,
} from "../HistoricalConversationEducationalClassificationPersistence.js";

import {
  HistoricalConversationEducationalClassificationService,
} from "../HistoricalConversationEducationalClassificationService.js";


class MemoryEvidencePersistenceStore
  implements EvidencePersistenceStore
{
  private readonly evidence =
    new Map<string, EvidenceItem>();


  public save(
    evidence:
      EvidenceItem,
  ): void {
    this.evidence.set(
      evidence.id,
      evidence,
    );
  }


  public load(
    evidenceId:
      string,
  ): EvidenceItem | null {
    return this.evidence.get(
      evidenceId,
    ) ?? null;
  }
}


function evidenceFixture(
  id:
    string,
  options: {
    conversationId?:
      string;

    conversationChecksum?:
      string;

    type?:
      EvidenceItem["type"];
  } = {},
): EvidenceItem {
  return {
    id,

    type:
      options.type ??
      "conversation",

    title:
      "Historical conversation evidence",

    source:
      "chatgpt-authenticated-browser",

    capturedAt:
      100,

    observedAt:
      100,

    contentRef:
      `historical://${id}`,

    checksum:
      `evidence-checksum-${id}`,

    metadata: {
      conversationId:
        options.conversationId ??
        "conversation-001",

      conversationChecksum:
        options.conversationChecksum ??
        "conversation-checksum-001",
    },

    relationships:
      {},
  };
}


async function withService(
  run:
    (
      service:
        HistoricalConversationEducationalClassificationService,
      evidenceStore:
        MemoryEvidencePersistenceStore,
    ) => Promise<void>,
): Promise<void> {
  const rootDir =
    await mkdtemp(
      path.join(
        os.tmpdir(),
        "korelumina-historical-classification-service-",
      ),
    );

  try {
    const evidenceStore =
      new MemoryEvidencePersistenceStore();

    const persistence =
      new HistoricalConversationEducationalClassificationPersistence({
        rootDir,
      });

    const service =
      new HistoricalConversationEducationalClassificationService({
        persistence,
        evidencePersistenceStore:
          evidenceStore,
      });

    await run(
      service,
      evidenceStore,
    );
  } finally {
    await rm(
      rootDir,
      {
        recursive:
          true,
        force:
          true,
      },
    );
  }
}


test(
  "service creates and persists classification from durable governed conversation evidence",
  async () => {
    await withService(
      async (
        service,
        evidenceStore,
      ) => {
        evidenceStore.save(
          evidenceFixture(
            "evidence-001",
          ),
        );

        const classification =
          await service.create({
            conversationId:
              "conversation-001",

            correlationId:
              "correlation-001",

            requirementContributions: [
              {
                requirementId:
                  "conversation:architecture",

                evidenceIds: [
                  "evidence-001",
                ],

                basis:
                  "Historical evidence explicitly describes the system architecture.",
              },
            ],

            createdAt:
              100,
          });

        assert.equal(
          classification.conversationId,
          "conversation-001",
        );

        assert.equal(
          classification.sourceChecksum,
          "conversation-checksum-001",
        );

        assert.deepEqual(
          classification.sourceEvidenceIds,
          [
            "evidence-001",
          ],
        );

        assert.deepEqual(
          await service.read(
            classification.classificationId,
          ),
          classification,
        );
      },
    );
  },
);


test(
  "service derives source evidence from all requirement contributions",
  async () => {
    await withService(
      async (
        service,
        evidenceStore,
      ) => {
        evidenceStore.save(
          evidenceFixture(
            "evidence-001",
          ),
        );

        evidenceStore.save(
          evidenceFixture(
            "evidence-002",
          ),
        );

        const classification =
          await service.create({
            conversationId:
              "conversation-001",

            correlationId:
              "correlation-001",

            requirementContributions: [
              {
                requirementId:
                  "conversation:architecture",

                evidenceIds: [
                  "evidence-002",
                  "evidence-001",
                ],

                basis:
                  "Architecture evidence.",
              },
              {
                requirementId:
                  "conversation:engineering",

                evidenceIds: [
                  "evidence-001",
                ],

                basis:
                  "Engineering evidence.",
              },
            ],

            createdAt:
              100,
          });

        assert.deepEqual(
          classification.sourceEvidenceIds,
          [
            "evidence-001",
            "evidence-002",
          ],
        );
      },
    );
  },
);


test(
  "service rejects missing governed evidence",
  async () => {
    await withService(
      async (
        service,
      ) => {
        await assert.rejects(
          () =>
            service.create({
              conversationId:
                "conversation-001",

              correlationId:
                "correlation-001",

              requirementContributions: [
                {
                  requirementId:
                    "conversation:architecture",

                  evidenceIds: [
                    "missing-evidence",
                  ],

                  basis:
                    "Architecture evidence.",
                },
              ],

              createdAt:
                100,
            }),
          /historical_conversation_educational_classification_service_evidence_missing/,
        );
      },
    );
  },
);


test(
  "service rejects non-conversation evidence",
  async () => {
    await withService(
      async (
        service,
        evidenceStore,
      ) => {
        evidenceStore.save(
          evidenceFixture(
            "evidence-001",
            {
              type:
                "document",
            },
          ),
        );

        await assert.rejects(
          () =>
            service.create({
              conversationId:
                "conversation-001",

              correlationId:
                "correlation-001",

              requirementContributions: [
                {
                  requirementId:
                    "conversation:architecture",

                  evidenceIds: [
                    "evidence-001",
                  ],

                  basis:
                    "Architecture evidence.",
                },
              ],

              createdAt:
                100,
            }),
          /historical_conversation_educational_classification_service_evidence_not_conversation/,
        );
      },
    );
  },
);


test(
  "service rejects evidence belonging to another conversation",
  async () => {
    await withService(
      async (
        service,
        evidenceStore,
      ) => {
        evidenceStore.save(
          evidenceFixture(
            "evidence-001",
            {
              conversationId:
                "conversation-OTHER",
            },
          ),
        );

        await assert.rejects(
          () =>
            service.create({
              conversationId:
                "conversation-001",

              correlationId:
                "correlation-001",

              requirementContributions: [
                {
                  requirementId:
                    "conversation:architecture",

                  evidenceIds: [
                    "evidence-001",
                  ],

                  basis:
                    "Architecture evidence.",
                },
              ],

              createdAt:
                100,
            }),
          /historical_conversation_educational_classification_service_conversation_mismatch/,
        );
      },
    );
  },
);


test(
  "service rejects evidence with inconsistent conversation checksums",
  async () => {
    await withService(
      async (
        service,
        evidenceStore,
      ) => {
        evidenceStore.save(
          evidenceFixture(
            "evidence-001",
            {
              conversationChecksum:
                "checksum-A",
            },
          ),
        );

        evidenceStore.save(
          evidenceFixture(
            "evidence-002",
            {
              conversationChecksum:
                "checksum-B",
            },
          ),
        );

        await assert.rejects(
          () =>
            service.create({
              conversationId:
                "conversation-001",

              correlationId:
                "correlation-001",

              requirementContributions: [
                {
                  requirementId:
                    "conversation:engineering",

                  evidenceIds: [
                    "evidence-001",
                    "evidence-002",
                  ],

                  basis:
                    "Engineering evidence.",
                },
              ],

              createdAt:
                100,
            }),
          /historical_conversation_educational_classification_service_conversation_checksum_mismatch/,
        );
      },
    );
  },
);


test(
  "service is idempotent for the same governed classification",
  async () => {
    await withService(
      async (
        service,
        evidenceStore,
      ) => {
        evidenceStore.save(
          evidenceFixture(
            "evidence-001",
          ),
        );

        const input = {
          conversationId:
            "conversation-001",

          correlationId:
            "correlation-001",

          requirementContributions: [
            {
              requirementId:
                "conversation:mission" as const,

              evidenceIds: [
                "evidence-001",
              ],

              basis:
                "Historical evidence explicitly defines mission.",
            },
          ],

          createdAt:
            100,
        };

        const first =
          await service.create(
            input,
          );

        const second =
          await service.create(
            input,
          );

        assert.deepEqual(
          second,
          first,
        );
      },
    );
  },
);
