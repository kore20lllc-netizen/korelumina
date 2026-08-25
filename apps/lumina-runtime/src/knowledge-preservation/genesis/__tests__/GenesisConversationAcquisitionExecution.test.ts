import assert from "node:assert/strict";
import test from "node:test";

import {
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";

import {
  tmpdir,
} from "node:os";

import path from "node:path";

import {
  GenesisConversationAcquisitionExecutor,
  FileGenesisConversationAcquisitionPersistenceStore,
} from "../GenesisConversationAcquisitionExecution.js";

import {
  GENESIS_CHATGPT_EXPORT_ROOT_ENV,
  resolveGenesisConversationRuntimeConfiguration,
} from "../GenesisConversationRuntimeConfiguration.js";


function exportDirectory():
  string {
  const root =
    mkdtempSync(
      path.join(
        tmpdir(),
        "korelumina-conversation-execution-",
      ),
    );

  writeFileSync(
    path.join(
      root,
      "conversations.json",
    ),
    JSON.stringify([
      {
        id:
          "conversation-001",

        title:
          "KoreLumina history",

        create_time:
          100,

        mapping: {
          node: {
            id:
              "node",

            parent:
              null,

            message: {
              id:
                "message-001",

              author: {
                role:
                  "user",
              },

              create_time:
                100,

              content: {
                parts: [
                  "Historical requirement.",
                ],
              },
            },
          },
        },
      },
    ]),
    "utf8",
  );

  return root;
}


test(
  "production acquisition persists independent HistoricalSource and Evidence custody",
  async () => {
    const exportRoot =
      exportDirectory();

    const storageRoot =
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-conversation-store-",
        ),
      );

    try {
      let now =
        1000;

      const configuration =
        resolveGenesisConversationRuntimeConfiguration({
          [
            GENESIS_CHATGPT_EXPORT_ROOT_ENV
          ]:
            exportRoot,
        });

      const persistence =
        new FileGenesisConversationAcquisitionPersistenceStore({
          storageRoot,
        });

      const executor =
        new GenesisConversationAcquisitionExecutor({
          configuration,

          persistence,

          repository:
            "korelumina",

          now:
            () =>
              now++,
        });

      const result =
        await executor.execute();

      assert.equal(
        result.state,
        "ACQUIRED",
      );

      assert.ok(
        result.record,
      );

      assert.equal(
        result.record.conversationCount,
        1,
      );

      assert.equal(
        result.record.historicalSourceCount,
        1,
      );

      assert.equal(
        result.record.evidenceCount,
        1,
      );

      assert.equal(
        result.record
          .evidence[0]
          .metadata
          .content,
        "Historical requirement.",
      );

      assert.equal(
        result.record
          .historicalSources[0]
          .historicalSourceId,
        result.record
          .evidence[0]
          .metadata
          .historicalSourceId,
      );

      assert.equal(
        persistence
          .loadLatest()
          ?.state,
        "ACQUIRED",
      );
    } finally {
      rmSync(
        exportRoot,
        {
          recursive:
            true,

          force:
            true,
        },
      );

      rmSync(
        storageRoot,
        {
          recursive:
            true,

          force:
            true,
        },
      );
    }
  },
);


test(
  "deterministic re-import retains one acquisition identity and records occurrences",
  async () => {
    const exportRoot =
      exportDirectory();

    const storageRoot =
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-conversation-store-",
        ),
      );

    try {
      let now =
        2000;

      const configuration =
        resolveGenesisConversationRuntimeConfiguration({
          [
            GENESIS_CHATGPT_EXPORT_ROOT_ENV
          ]:
            exportRoot,
        });

      const persistence =
        new FileGenesisConversationAcquisitionPersistenceStore({
          storageRoot,
        });

      const executor =
        new GenesisConversationAcquisitionExecutor({
          configuration,

          persistence,

          repository:
            "korelumina",

          now:
            () =>
              now++,
        });

      const first =
        await executor.execute();

      const second =
        await executor.execute();

      assert.equal(
        first.record
          ?.acquisitionId,
        second.record
          ?.acquisitionId,
      );

      assert.equal(
        second.record
          ?.occurrenceCount,
        2,
      );

      assert.equal(
        second.record
          ?.occurrences.length,
        2,
      );
    } finally {
      rmSync(
        exportRoot,
        {
          recursive:
            true,

          force:
            true,
        },
      );

      rmSync(
        storageRoot,
        {
          recursive:
            true,

          force:
            true,
        },
      );
    }
  },
);


test(
  "unconfigured acquisition fails closed and persists failure state",
  async () => {
    const storageRoot =
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-conversation-store-",
        ),
      );

    try {
      const configuration =
        resolveGenesisConversationRuntimeConfiguration(
          {},
        );

      const persistence =
        new FileGenesisConversationAcquisitionPersistenceStore({
          storageRoot,
        });

      const executor =
        new GenesisConversationAcquisitionExecutor({
          configuration,

          persistence,

          repository:
            "korelumina",

          now:
            () =>
              3000,
        });

      const result =
        await executor.execute();

      assert.equal(
        result.state,
        "FAILED",
      );

      assert.match(
        result.failure
          ?.error ??
        "",
        /must be configured/i,
      );

      assert.equal(
        persistence
          .loadLatest()
          ?.state,
        "FAILED",
      );
    } finally {
      rmSync(
        storageRoot,
        {
          recursive:
            true,

          force:
            true,
        },
      );
    }
  },
);


test(
  "malformed configured export persists failed acquisition rather than fabricated Evidence",
  async () => {
    const exportRoot =
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-malformed-export-",
        ),
      );

    const storageRoot =
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-conversation-store-",
        ),
      );

    try {
      writeFileSync(
        path.join(
          exportRoot,
          "conversations.json",
        ),
        "{ malformed",
        "utf8",
      );

      const configuration =
        resolveGenesisConversationRuntimeConfiguration({
          [
            GENESIS_CHATGPT_EXPORT_ROOT_ENV
          ]:
            exportRoot,
        });

      const persistence =
        new FileGenesisConversationAcquisitionPersistenceStore({
          storageRoot,
        });

      const executor =
        new GenesisConversationAcquisitionExecutor({
          configuration,

          persistence,

          repository:
            "korelumina",

          now:
            () =>
              4000,
        });

      const result =
        await executor.execute();

      assert.equal(
        result.state,
        "FAILED",
      );

      assert.match(
        result.failure
          ?.error ??
        "",
        /json_invalid/,
      );

      assert.equal(
        persistence
          .loadLatest()
          ?.state,
        "FAILED",
      );
    } finally {
      rmSync(
        exportRoot,
        {
          recursive:
            true,

          force:
            true,
        },
      );

      rmSync(
        storageRoot,
        {
          recursive:
            true,

          force:
            true,
        },
      );
    }
  },
);
