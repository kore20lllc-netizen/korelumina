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
  ChatGPTBrowserRecoverySource,
} from "../ChatGPTBrowserRecoverySource.js";


function tempRoot():
  string {
  return mkdtempSync(
    path.join(
      tmpdir(),
      "korelumina-chatgpt-browser-recovery-",
    ),
  );
}


function writeConversation(
  root:
    string,

  patch:
    Record<
      string,
      unknown
    > = {},
): void {
  const snapshot = {
    snapshotVersion:
      "chatgpt-browser-recovery:v1",

    conversationId:
      "conversation-001",

    title:
      "KoreLumina architecture",

    conversationUrl:
      "https://chatgpt.com/c/conversation-001",

    capturedAt:
      1000,

    messages: [
      {
        messageId:
          "message-001",

        role:
          "user",

        order:
          0,

        timestamp:
          100,

        content:
          "Build KoreLumina.",
      },

      {
        messageId:
          "message-002",

        role:
          "assistant",

        order:
          1,

        timestamp:
          200,

        content:
          "Architecture proposed.",
      },
    ],

    ...patch,
  };

  writeFileSync(
    path.join(
      root,
      "conversation-001.json",
    ),
    JSON.stringify(
      snapshot,
      null,
      2,
    ),
    "utf8",
  );
}


test(
  "browser recovery produces governed historical conversation input",
  async () => {
    const root =
      tempRoot();

    try {
      writeConversation(
        root,
      );

      const source =
        new ChatGPTBrowserRecoverySource({
          recoveryRoot:
            root,

          acquiredAt:
            () =>
              2000,
        });

      const result =
        await source.acquire();

      assert.equal(
        result.conversations.length,
        1,
      );

      assert.equal(
        result.conversations[0]
          .conversationId,
        "conversation-001",
      );

      assert.equal(
        result.conversations[0]
          .acquisition.provider,
        "chatgpt-authenticated-browser",
      );

      assert.equal(
        result.conversations[0]
          .acquisition.acquisitionMethod,
        "chatgpt-browser-dom-recovery-v1",
      );

      assert.equal(
        result.conversations[0]
          .privacy.sensitivity,
        "sensitive",
      );

      assert.equal(
        result.conversations[0]
          .messages.length,
        2,
      );
    } finally {
      rmSync(
        root,
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
  "browser recovery is deterministic for unchanged snapshot content",
  async () => {
    const root =
      tempRoot();

    try {
      writeConversation(
        root,
      );

      const first =
        await new ChatGPTBrowserRecoverySource({
          recoveryRoot:
            root,

          acquiredAt:
            () =>
              2000,
        }).acquire();

      const second =
        await new ChatGPTBrowserRecoverySource({
          recoveryRoot:
            root,

          acquiredAt:
            () =>
              3000,
        }).acquire();

      assert.equal(
        first.acquisitionId,
        second.acquisitionId,
      );

      assert.equal(
        first.conversations[0]
          .sourceRevision,
        second.conversations[0]
          .sourceRevision,
      );
    } finally {
      rmSync(
        root,
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
  "browser recovery rejects non-ChatGPT conversation URLs",
  async () => {
    const root =
      tempRoot();

    try {
      writeConversation(
        root,
        {
          conversationUrl:
            "https://example.com/c/conversation-001",
        },
      );

      const source =
        new ChatGPTBrowserRecoverySource({
          recoveryRoot:
            root,
        });

      await assert.rejects(
        source.acquire(),
        /conversation_url_untrusted/,
      );
    } finally {
      rmSync(
        root,
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
  "browser recovery rejects duplicate message identities",
  async () => {
    const root =
      tempRoot();

    try {
      writeConversation(
        root,
        {
          messages: [
            {
              messageId:
                "duplicate",

              role:
                "user",

              order:
                0,

              content:
                "one",
            },

            {
              messageId:
                "duplicate",

              role:
                "assistant",

              order:
                1,

              content:
                "two",
            },
          ],
        },
      );

      const source =
        new ChatGPTBrowserRecoverySource({
          recoveryRoot:
            root,
        });

      await assert.rejects(
        source.acquire(),
        /duplicate_message_id/,
      );
    } finally {
      rmSync(
        root,
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
  "browser recovery never claims historical completeness",
  async () => {
    const root =
      tempRoot();

    try {
      writeConversation(
        root,
      );

      const result =
        await new ChatGPTBrowserRecoverySource({
          recoveryRoot:
            root,
        }).acquire();

      assert.deepEqual(
        result.gaps,
        [],
      );

      assert.equal(
        "historicalCompletenessCertified" in
          result,
        false,
      );
    } finally {
      rmSync(
        root,
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
