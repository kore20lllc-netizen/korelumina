import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  rm,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  createHistoricalConversationEducationalClassification,
  type HistoricalConversationEducationalClassification,
} from "../HistoricalConversationEducationalClassification.js";

import {
  HistoricalConversationEducationalClassificationPersistence,
} from "../HistoricalConversationEducationalClassificationPersistence.js";


async function withTemporaryRoot(
  run:
    (
      rootDir:
        string,
    ) => Promise<void>,
): Promise<void> {
  const rootDir =
    await mkdtemp(
      path.join(
        os.tmpdir(),
        "korelumina-historical-conversation-classification-",
      ),
    );

  try {
    await run(
      rootDir,
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


function createFixture(
  conversationId =
    "conversation-001",
) {
  return createHistoricalConversationEducationalClassification({
    conversationId,

    sourceEvidenceIds: [
      `evidence-${conversationId}`,
    ],

    sourceChecksum:
      `checksum-${conversationId}`,

    requirementContributions: [
      {
        requirementId:
          "conversation:architecture",

        evidenceIds: [
          `evidence-${conversationId}`,
        ],

        basis:
          "Historical evidence describes architecture.",
      },
    ],

    createdAt:
      100,
  });
}


test(
  "persistence saves and reads a governed classification",
  async () => {
    await withTemporaryRoot(
      async (
        rootDir,
      ) => {
        const persistence =
          new HistoricalConversationEducationalClassificationPersistence({
            rootDir,
          });

        const classification =
          createFixture();

        await persistence.save(
          classification,
        );

        const loaded =
          await persistence.read(
            classification.classificationId,
          );

        assert.deepEqual(
          loaded,
          classification,
        );
      },
    );
  },
);


test(
  "persistence is idempotent for the same deterministic classification",
  async () => {
    await withTemporaryRoot(
      async (
        rootDir,
      ) => {
        const persistence =
          new HistoricalConversationEducationalClassificationPersistence({
            rootDir,
          });

        const classification =
          createFixture();

        const first =
          await persistence.save(
            classification,
          );

        const second =
          await persistence.save(
            classification,
          );

        assert.deepEqual(
          second,
          first,
        );
      },
    );
  },
);


test(
  "persistence rejects conflicting payload at the same governed identity",
  async () => {
    await withTemporaryRoot(
      async (
        rootDir,
      ) => {
        const persistence =
          new HistoricalConversationEducationalClassificationPersistence({
            rootDir,
          });

        const classification =
          createFixture();

        await persistence.save(
          classification,
        );

        const conflicting: HistoricalConversationEducationalClassification = {
          ...classification,

          createdAt:
            999,
        };

        await assert.rejects(
          () =>
            persistence.save(
              conflicting,
            ),
          /historical_conversation_educational_classification_persistence_identity_conflict/,
        );
      },
    );
  },
);


test(
  "persistence rejects invalid governed classification before writing",
  async () => {
    await withTemporaryRoot(
      async (
        rootDir,
      ) => {
        const persistence =
          new HistoricalConversationEducationalClassificationPersistence({
            rootDir,
          });

        const classification =
          createFixture();

        const invalid: HistoricalConversationEducationalClassification = {
          ...classification,

          checksum:
            "tampered",
        };

        await assert.rejects(
          () =>
            persistence.save(
              invalid,
            ),
          /historical_conversation_educational_classification_persistence_invalid/,
        );

        assert.equal(
          await persistence.read(
            invalid.classificationId,
          ),
          null,
        );
      },
    );
  },
);


test(
  "persistence lists classifications deterministically",
  async () => {
    await withTemporaryRoot(
      async (
        rootDir,
      ) => {
        const persistence =
          new HistoricalConversationEducationalClassificationPersistence({
            rootDir,
          });

        const first =
          createFixture(
            "conversation-001",
          );

        const second =
          createFixture(
            "conversation-002",
          );

        await persistence.save(
          second,
        );

        await persistence.save(
          first,
        );

        const listed =
          await persistence.list();

        assert.equal(
          listed.length,
          2,
        );

        assert.deepEqual(
          new Set(
            listed.map(
              (
                classification,
              ) =>
                classification.classificationId,
            ),
          ),
          new Set([
            first.classificationId,
            second.classificationId,
          ]),
        );
      },
    );
  },
);


test(
  "persistence lists classifications by conversation identity",
  async () => {
    await withTemporaryRoot(
      async (
        rootDir,
      ) => {
        const persistence =
          new HistoricalConversationEducationalClassificationPersistence({
            rootDir,
          });

        const first =
          createFixture(
            "conversation-001",
          );

        const second =
          createFixture(
            "conversation-002",
          );

        await persistence.save(
          first,
        );

        await persistence.save(
          second,
        );

        const listed =
          await persistence.listByConversationId(
            "conversation-002",
          );

        assert.deepEqual(
          listed,
          [
            second,
          ],
        );
      },
    );
  },
);


test(
  "persistence writes JSON through the governed storage directory",
  async () => {
    await withTemporaryRoot(
      async (
        rootDir,
      ) => {
        const persistence =
          new HistoricalConversationEducationalClassificationPersistence({
            rootDir,
          });

        const classification =
          createFixture();

        await persistence.save(
          classification,
        );

        const directory =
          path.join(
            rootDir,
            "historical-conversation-educational-classifications",
          );

        const filename =
          `${encodeURIComponent(classification.classificationId)}.json`;

        const raw =
          await readFile(
            path.join(
              directory,
              filename,
            ),
            "utf8",
          );

        assert.deepEqual(
          JSON.parse(
            raw,
          ),
          classification,
        );
      },
    );
  },
);
