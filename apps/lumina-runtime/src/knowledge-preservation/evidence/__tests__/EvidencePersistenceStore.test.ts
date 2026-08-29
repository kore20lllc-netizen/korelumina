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
  FileEvidencePersistenceStore,
} from "../index.js";

import type {
  EvidenceItem,
} from "../index.js";


function evidence(
  overrides:
    Partial<EvidenceItem> = {},
): EvidenceItem {
  return {
    id:
      "evidence:test:1",

    type:
      "document",

    title:
      "Evidence persistence fixture",

    source:
      "test",

    capturedAt:
      200,

    observedAt:
      100,

    contentRef:
      "docs/test.md",

    checksum:
      "sha256:test",

    metadata: {
      historicalSourceId:
        "genesis-source:document:test",
    },

    relationships:
      {},

    ...overrides,
  };
}


test(
  "general Evidence persistence saves and reloads a complete EvidenceItem",
  () => {
    const root =
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-evidence-store-",
        ),
      );

    try {
      const store =
        new FileEvidencePersistenceStore({
          storageRoot:
            root,
        });

      const item =
        evidence();

      store.save(
        item,
      );

      assert.deepEqual(
        store.load(
          item.id,
        ),
        item,
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
  "general Evidence persistence is idempotent for the same immutable Evidence identity",
  () => {
    const root =
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-evidence-store-idempotent-",
        ),
      );

    try {
      const store =
        new FileEvidencePersistenceStore({
          storageRoot:
            root,
        });

      const item =
        evidence();

      store.save(
        item,
      );

      store.save(
        item,
      );

      assert.deepEqual(
        store.load(
          item.id,
        ),
        item,
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
  "general Evidence persistence rejects mutation of an existing Evidence identity",
  () => {
    const root =
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-evidence-store-conflict-",
        ),
      );

    try {
      const store =
        new FileEvidencePersistenceStore({
          storageRoot:
            root,
        });

      const item =
        evidence();

      store.save(
        item,
      );

      assert.throws(
        () =>
          store.save(
            evidence({
              checksum:
                "sha256:different",
            }),
          ),
        /evidence_persistence_identity_conflict/,
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
  "general Evidence persistence validates Evidence before custody",
  () => {
    const root =
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-evidence-store-invalid-",
        ),
      );

    try {
      const store =
        new FileEvidencePersistenceStore({
          storageRoot:
            root,
        });

      assert.throws(
        () =>
          store.save({
            ...evidence(),

            contentRef:
              "",
          }),
        /evidence_intake_invalid:contentRef/,
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
