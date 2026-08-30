import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, {
  type TestContext,
} from "node:test";

import {
  CanonicalKnowledgeQueryService,
} from "../CanonicalKnowledgeQueryService.js";

import {
  CanonicalKnowledgeStore,
} from "../CanonicalKnowledgeStore.js";


function createCanonicalItem(
  id: string,
  title: string,
  summary: string,
) {
  return {
    id,

    type:
      "CandidateArtifact" as const,

    title,

    summary,

    confidence:
      1,

    evidenceRefs:
      [],

    relationships:
      {},

    createdAt:
      1,

    updatedAt:
      1,

    status:
      "canonical" as const,

    metadata:
      {},
  };
}


function createIsolatedStore(
  t:
    TestContext,
): CanonicalKnowledgeStore {
  const root =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "korelumina-canonical-query-",
      ),
    );

  t.after(
    () => {
      fs.rmSync(
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

  return new CanonicalKnowledgeStore({
    root,
  });
}


test(
  "retrieves canonical knowledge from natural-language agent query terms",
  t => {
    const store =
      createIsolatedStore(
        t,
      );

    store.registerGoverned(
      createCanonicalItem(
        "canonical:architecture",
        "KoreLumina Master Architecture",
        "Defines governed architecture boundaries and canonical knowledge flow.",
      ),
    );

    store.registerGoverned(
      createCanonicalItem(
        "canonical:unrelated",
        "Billing Operations",
        "Invoice and payment processing rules.",
      ),
    );

    const query =
      new CanonicalKnowledgeQueryService(
        store,
      );

    const results =
      query.search(
        "Using only governed KoreLumina canonical knowledge and organizational memory, identify the architecture and governance boundaries that must be preserved.",
      );

    assert.equal(
      results.length,
      1,
    );

    assert.equal(
      results[0]?.id,
      "canonical:architecture",
    );
  },
);


test(
  "ranks items with more matching query terms first",
  t => {
    const store =
      createIsolatedStore(
        t,
      );

    store.registerGoverned(
      createCanonicalItem(
        "canonical:partial",
        "Architecture",
        "Platform architecture.",
      ),
    );

    store.registerGoverned(
      createCanonicalItem(
        "canonical:strong",
        "Governed Architecture",
        "Canonical architecture governance boundaries.",
      ),
    );

    const query =
      new CanonicalKnowledgeQueryService(
        store,
      );

    const results =
      query.search(
        "canonical architecture governance boundaries",
      );

    assert.equal(
      results[0]?.id,
      "canonical:strong",
    );
  },
);


test(
  "returns all canonical knowledge when query contains no searchable terms",
  t => {
    const store =
      createIsolatedStore(
        t,
      );

    store.registerGoverned(
      createCanonicalItem(
        "canonical:test",
        "Architecture",
        "Architecture guidance.",
      ),
    );

    const query =
      new CanonicalKnowledgeQueryService(
        store,
      );

    assert.equal(
      query.search(
        "a to of",
      ).length,
      1,
    );
  },
);
