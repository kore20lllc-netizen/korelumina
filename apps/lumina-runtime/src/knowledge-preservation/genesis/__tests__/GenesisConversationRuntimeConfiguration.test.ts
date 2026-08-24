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
  GENESIS_CHATGPT_EXPORT_ROOT_ENV,
  resolveGenesisConversationRuntimeConfiguration,
} from "../GenesisConversationRuntimeConfiguration.js";


test(
  "unconfigured runtime remains SOURCE ACCESS BLOCKED",
  () => {
    const configuration =
      resolveGenesisConversationRuntimeConfiguration(
        {},
      );

    assert.equal(
      configuration.state,
      "UNCONFIGURED",
    );

    assert.equal(
      configuration
        .boundary
        .classification,
      "SOURCE ACCESS BLOCKED",
    );

    assert.equal(
      configuration
        .boundary
        .acquisition
        .available,
      false,
    );

    assert.equal(
      configuration.source,
      null,
    );

    assert.equal(
      configuration.adapter,
      null,
    );
  },
);


test(
  "configured but missing source fails closed",
  () => {
    const configuration =
      resolveGenesisConversationRuntimeConfiguration({
        [
          GENESIS_CHATGPT_EXPORT_ROOT_ENV
        ]:
          "/definitely/not/a/real/chatgpt/export",
      });

    assert.equal(
      configuration.state,
      "UNAVAILABLE",
    );

    assert.equal(
      configuration
        .boundary
        .classification,
      "SOURCE ACCESS BLOCKED",
    );

    assert.equal(
      configuration
        .boundary
        .acquisition
        .available,
      false,
    );
  },
);


test(
  "readable configured export activates governed acquisition boundary",
  async () => {
    const root =
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-runtime-chatgpt-",
        ),
      );

    try {
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
              "KoreLumina",

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

      const configuration =
        resolveGenesisConversationRuntimeConfiguration({
          [
            GENESIS_CHATGPT_EXPORT_ROOT_ENV
          ]:
            root,
        });

      assert.equal(
        configuration.state,
        "CONFIGURED",
      );

      assert.equal(
        configuration
          .boundary
          .classification,
        "SUPPORTED AND INGESTIBLE",
      );

      assert.equal(
        configuration
          .boundary
          .acquisition
          .available,
        true,
      );

      assert.ok(
        configuration.source,
      );

      assert.ok(
        configuration.adapter,
      );

      const snapshot =
        await configuration
          .source
          .acquire();

      assert.equal(
        snapshot
          .conversations
          .length,
        1,
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
  "configured directory alone does not hide malformed export data",
  async () => {
    const root =
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-runtime-chatgpt-",
        ),
      );

    try {
      writeFileSync(
        path.join(
          root,
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
            root,
        });

      assert.equal(
        configuration.state,
        "CONFIGURED",
      );

      assert.ok(
        configuration.source,
      );

      await assert.rejects(
        () =>
          configuration
            .source!
            .acquire(),
        /json_invalid/,
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
