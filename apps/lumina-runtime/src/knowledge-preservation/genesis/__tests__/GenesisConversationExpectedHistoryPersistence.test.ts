import assert from "node:assert/strict";
import test from "node:test";

import {
  mkdtempSync,
  rmSync,
} from "node:fs";

import {
  tmpdir,
} from "node:os";

import path from "node:path";

import {
  buildGenesisConversationExpectedHistoryInventory,
} from "../GenesisConversationExpectedHistoryInventory.js";

import {
  FileGenesisConversationExpectedHistoryPersistenceStore,
} from "../GenesisConversationExpectedHistoryPersistence.js";


function inventory() {
  return buildGenesisConversationExpectedHistoryInventory({
    authority: {
      authorityId:
        "day-zero-history",

      authorityClass:
        "human-certified-institutional-history",

      certifiedBy:
        "korelumina-human-governance",

      certifiedAt:
        1000,

      scope:
        "day-zero-through-present",

      version:
        "1",
    },

    conversations: [
      {
        conversationId:
          "conversation-001",

        disposition:
          "EXPECTED_RECOVERABLE",

        basis:
          "certified inventory",
      },
    ],
  });
}


test(
  "persists and reloads authoritative expected history",
  () => {
    const root =
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-expected-history-",
        ),
      );

    try {
      const store =
        new FileGenesisConversationExpectedHistoryPersistenceStore({
          storageRoot:
            root,
        });

      const value =
        inventory();

      store.save(
        value,
      );

      assert.deepEqual(
        store.load(),
        value,
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
  "re-saving identical inventory is idempotent",
  () => {
    const root =
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-expected-history-",
        ),
      );

    try {
      const store =
        new FileGenesisConversationExpectedHistoryPersistenceStore({
          storageRoot:
            root,
        });

      const value =
        inventory();

      store.save(
        value,
      );

      store.save(
        value,
      );

      assert.equal(
        store.load()
          ?.inventoryId,
        value.inventoryId,
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
