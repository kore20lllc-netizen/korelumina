import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import type {
  CanonicalKnowledgeItem,
} from "../CanonicalKnowledgeItem.js";

import {
  CanonicalKnowledgeStore,
} from "../CanonicalKnowledgeStore.js";


function canonical(
  id:
    string,
): CanonicalKnowledgeItem {
  return {
    id,
    type:
      "CandidateArtifact",
    title:
      "Durable canonical knowledge",
    summary:
      "Canonical knowledge must survive a fresh store instance.",
    confidence:
      1,
    evidenceRefs: [
      "evidence:persistence-test",
    ],
    relationships:
      {},
    createdAt:
      1,
    updatedAt:
      1,
    status:
      "canonical",
    metadata: {
      source:
        "persistence-test",
    },
  };
}


test(
  "governed canonical knowledge survives a fresh store instance",
  () => {
    const root =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-canonical-",
        ),
      );

    try {
      const first =
        new CanonicalKnowledgeStore({
          root,
        });

      const item =
        canonical(
          "canonical:persistence-test",
        );

      first.registerGoverned(
        item,
      );

      const second =
        new CanonicalKnowledgeStore({
          root,
        });

      assert.equal(
        second.size(),
        1,
      );

      assert.deepEqual(
        second.get(
          item.id,
        ),
        item,
      );

      assert.deepEqual(
        second.list(),
        [
          item,
        ],
      );
    } finally {
      fs.rmSync(
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
  "canonical persistence roots are isolated",
  () => {
    const firstRoot =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-canonical-a-",
        ),
      );

    const secondRoot =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-canonical-b-",
        ),
      );

    try {
      const first =
        new CanonicalKnowledgeStore({
          root:
            firstRoot,
        });

      first.registerGoverned(
        canonical(
          "canonical:isolated",
        ),
      );

      const second =
        new CanonicalKnowledgeStore({
          root:
            secondRoot,
        });

      assert.equal(
        second.size(),
        0,
      );

      assert.equal(
        second.get(
          "canonical:isolated",
        ),
        undefined,
      );
    } finally {
      fs.rmSync(
        firstRoot,
        {
          recursive:
            true,
          force:
            true,
        },
      );

      fs.rmSync(
        secondRoot,
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
  "clear does not destroy durable canonical governance state",
  () => {
    const root =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-canonical-clear-",
        ),
      );

    try {
      const first =
        new CanonicalKnowledgeStore({
          root,
        });

      const item =
        canonical(
          "canonical:clear-test",
        );

      first.registerGoverned(
        item,
      );

      first.clear();

      assert.equal(
        first.size(),
        0,
      );

      const restarted =
        new CanonicalKnowledgeStore({
          root,
        });

      assert.deepEqual(
        restarted.get(
          item.id,
        ),
        item,
      );
    } finally {
      fs.rmSync(
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
