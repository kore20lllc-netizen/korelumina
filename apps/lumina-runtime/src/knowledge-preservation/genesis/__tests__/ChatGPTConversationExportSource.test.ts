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
  ChatGPTConversationExportSource,
} from "../ChatGPTConversationExportSource.js";

import {
  GenesisHistoricalConversationSourceAdapter,
} from "../GenesisHistoricalConversationSourceAdapter.js";


function withExport(
  files:
    Readonly<
      Record<
        string,
        unknown
      >
    >,

  run:
    (
      root:
        string,
    ) =>
      Promise<void>,
): Promise<void> {
  const root =
    mkdtempSync(
      path.join(
        tmpdir(),
        "korelumina-chatgpt-export-",
      ),
    );

  for (
    const [
      filename,
      content,
    ]
    of Object.entries(
      files,
    )
  ) {
    writeFileSync(
      path.join(
        root,
        filename,
      ),
      JSON.stringify(
        content,
      ),
      "utf8",
    );
  }

  return run(
    root,
  ).finally(
    () => {
      rmSync(
        root,
        {
          recursive:
            true,

          force:
            true,
        },
      );
    },
  );
}


function exportedConversation() {
  return {
    id:
      "conversation-001",

    title:
      "KoreLumina architecture",

    create_time:
      100,

    update_time:
      300,

    mapping: {
      "node-root": {
        id:
          "node-root",

        parent:
          null,

        message:
          null,
      },

      "node-2": {
        id:
          "node-2",

        parent:
          "node-1",

        message: {
          id:
            "message-002",

          author: {
            role:
              "assistant",
          },

          create_time:
            200,

          content: {
            parts: [
              "Implementation response.",
            ],
          },
        },
      },

      "node-1": {
        id:
          "node-1",

        parent:
          "node-root",

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
              "Architecture requirement.",
            ],
          },
        },
      },

      "branch-node": {
        id:
          "branch-node",

        parent:
          "node-1",

        message: {
          id:
            "message-branch",

          author: {
            role:
              "assistant",
          },

          create_time:
            250,

          content: {
            parts: [
              "Alternative historical branch.",
            ],
          },
        },
      },
    },
  };
}


test(
  "reads conversations.json as governed ChatGPT export history",
  async () => {
    await withExport(
      {
        "conversations.json": [
          exportedConversation(),
        ],
      },

      async (
        root,
      ) => {
        const source =
          new ChatGPTConversationExportSource({
            exportRoot:
              root,

            acquiredAt:
              () =>
                1000,
          });

        const snapshot =
          await source.acquire();

        assert.equal(
          snapshot.conversations.length,
          1,
        );

        assert.equal(
          snapshot.conversations[0]
            .conversationId,
          "conversation-001",
        );

        assert.equal(
          snapshot.conversations[0]
            .acquisition
            .provider,
          "chatgpt-data-export",
        );
      },
    );
  },
);


test(
  "discovers numbered conversations JSON files deterministically",
  async () => {
    await withExport(
      {
        "conversations-2.json": [
          {
            ...exportedConversation(),

            id:
              "conversation-002",
          },
        ],

        "conversations-1.json": [
          exportedConversation(),
        ],
      },

      async (
        root,
      ) => {
        const source =
          new ChatGPTConversationExportSource({
            exportRoot:
              root,

            acquiredAt:
              () =>
                1000,
          });

        const snapshot =
          await source.acquire();

        assert.deepEqual(
          snapshot.conversations.map(
            (
              conversation,
            ) =>
              conversation.conversationId,
          ),
          [
            "conversation-001",
            "conversation-002",
          ],
        );
      },
    );
  },
);


test(
  "preserves all exported message branches rather than selecting only a current branch",
  async () => {
    await withExport(
      {
        "conversations.json": [
          exportedConversation(),
        ],
      },

      async (
        root,
      ) => {
        const source =
          new ChatGPTConversationExportSource({
            exportRoot:
              root,

            acquiredAt:
              () =>
                1000,
          });

        const snapshot =
          await source.acquire();

        assert.deepEqual(
          snapshot.conversations[0]
            .messages
            .map(
              (
                message,
              ) =>
                message.messageId,
            ),
          [
            "message-001",
            "message-002",
            "message-branch",
          ],
        );
      },
    );
  },
);


test(
  "normalizes export timestamps while preserving raw timestamp metadata",
  async () => {
    await withExport(
      {
        "conversations.json": [
          exportedConversation(),
        ],
      },

      async (
        root,
      ) => {
        const source =
          new ChatGPTConversationExportSource({
            exportRoot:
              root,

            acquiredAt:
              () =>
                1_000_000,
          });

        const snapshot =
          await source.acquire();

        const first =
          snapshot.conversations[0]
            .messages[0];

        assert.equal(
          first.timestamp,
          100_000,
        );

        assert.equal(
          first.metadata?.rawTimestamp,
          100,
        );
      },
    );
  },
);


test(
  "does not invent project identity from undocumented export fields",
  async () => {
    await withExport(
      {
        "conversations.json": [
          {
            ...exportedConversation(),

            project_id:
              "undocumented-project",
          },
        ],
      },

      async (
        root,
      ) => {
        const source =
          new ChatGPTConversationExportSource({
            exportRoot:
              root,

            acquiredAt:
              () =>
                1000,
          });

        const snapshot =
          await source.acquire();

        assert.equal(
          snapshot.conversations[0]
            .projectId,
          undefined,
        );
      },
    );
  },
);


test(
  "permits governed project association through explicit resolver",
  async () => {
    await withExport(
      {
        "conversations.json": [
          exportedConversation(),
        ],
      },

      async (
        root,
      ) => {
        const source =
          new ChatGPTConversationExportSource({
            exportRoot:
              root,

            acquiredAt:
              () =>
                1000,

            projectResolver:
              (
                conversation,
              ) =>
                conversation.id ===
                  "conversation-001"
                  ? "korelumina"
                  : undefined,
          });

        const snapshot =
          await source.acquire();

        assert.equal(
          snapshot.conversations[0]
            .projectId,
          "korelumina",
        );
      },
    );
  },
);


test(
  "retains raw exported message and node provenance",
  async () => {
    await withExport(
      {
        "conversations.json": [
          exportedConversation(),
        ],
      },

      async (
        root,
      ) => {
        const source =
          new ChatGPTConversationExportSource({
            exportRoot:
              root,

            acquiredAt:
              () =>
                1000,
          });

        const snapshot =
          await source.acquire();

        const first =
          snapshot.conversations[0]
            .messages[0];

        assert.equal(
          typeof first.metadata
            ?.rawMessage,
          "object",
        );

        assert.equal(
          typeof first.metadata
            ?.rawNode,
          "object",
        );
      },
    );
  },
);


test(
  "source revision is stable across deterministic re-import",
  async () => {
    await withExport(
      {
        "conversations.json": [
          exportedConversation(),
        ],
      },

      async (
        root,
      ) => {
        const source =
          new ChatGPTConversationExportSource({
            exportRoot:
              root,

            acquiredAt:
              () =>
                1000,
          });

        const first =
          await source.acquire();

        const second =
          await source.acquire();

        assert.equal(
          first.conversations[0]
            .sourceRevision,
          second.conversations[0]
            .sourceRevision,
        );

        assert.equal(
          first.acquisitionId,
          second.acquisitionId,
        );
      },
    );
  },
);


test(
  "export mutation changes source revision without changing conversation identity",
  async () => {
    await withExport(
      {
        "conversations.json": [
          exportedConversation(),
        ],
      },

      async (
        root,
      ) => {
        const source =
          new ChatGPTConversationExportSource({
            exportRoot:
              root,

            acquiredAt:
              () =>
                1000,
          });

        const first =
          await source.acquire();

        const changed =
          exportedConversation();

        (
          changed.mapping[
            "node-1"
          ] as {
            message:
              {
                content:
                  {
                    parts:
                      string[];
                  };
              };
          }
        ).message.content.parts = [
          "Corrected architecture requirement.",
        ];

        writeFileSync(
          path.join(
            root,
            "conversations.json",
          ),
          JSON.stringify([
            changed,
          ]),
          "utf8",
        );

        const second =
          await source.acquire();

        assert.equal(
          first.conversations[0]
            .conversationId,
          second.conversations[0]
            .conversationId,
        );

        assert.notEqual(
          first.conversations[0]
            .sourceRevision,
          second.conversations[0]
            .sourceRevision,
        );
      },
    );
  },
);


test(
  "provider feeds the certified Genesis historical conversation adapter",
  async () => {
    await withExport(
      {
        "conversations.json": [
          exportedConversation(),
        ],
      },

      async (
        root,
      ) => {
        const source =
          new ChatGPTConversationExportSource({
            exportRoot:
              root,

            acquiredAt:
              () =>
                1000,

            projectResolver:
              () =>
                "korelumina",
          });

        const adapter =
          new GenesisHistoricalConversationSourceAdapter({
            source,
          });

        const result =
          await adapter.discover({
            mode:
              "full",

            repository:
              "korelumina",

            includedEvidenceTypes: [
              "conversation",
            ],

            excludedEvidenceTypes:
              [],

            explicitlyExcludedSourceIds:
              [],

            governancePolicyVersion:
              "test-v1",

            replayContractVersion:
              "1.0",
          });

        assert.equal(
          result.sources.length,
          3,
        );

        assert.equal(
          adapter
            .listAcquiredEvidence()
            .length,
          3,
        );

        assert.equal(
          result.sources[0]
            .metadata
            .projectId,
          "korelumina",
        );
      },
    );
  },
);


test(
  "missing conversation files fail closed",
  async () => {
    await withExport(
      {
        "other.json": [],
      },

      async (
        root,
      ) => {
        const source =
          new ChatGPTConversationExportSource({
            exportRoot:
              root,
          });

        await assert.rejects(
          () =>
            source.acquire(),
          /conversation_files_missing/,
        );
      },
    );
  },
);


test(
  "missing conversation identity fails closed",
  async () => {
    await withExport(
      {
        "conversations.json": [
          {
            title:
              "No identity",

            mapping:
              {},
          },
        ],
      },

      async (
        root,
      ) => {
        const source =
          new ChatGPTConversationExportSource({
            exportRoot:
              root,
          });

        await assert.rejects(
          () =>
            source.acquire(),
          /conversation_identity_required/,
        );
      },
    );
  },
);
