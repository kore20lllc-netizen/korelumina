import assert from "node:assert/strict";

import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";

import os from "node:os";

import path from "node:path";

import test from "node:test";

import type {
  CanonicalKnowledgeItem,
} from "../../../canonical-knowledge/index.js";

import {
  KnowledgePlatform,
} from "../../KnowledgePlatform.js";

import {
  preservePersistedTimestamps,
  rehydrateRuntimeCanonicalKnowledge,
} from "../rehydrateRuntimeCanonicalKnowledge.js";


function canonicalPackage(
  summary =
    "Canonical architecture.",
) {
  return {
    id:
      "knowledge-package:stability",
    state:
      "canonical",
    sourceEvidenceRefs: [
      "evidence:stability",
    ],
    items: [
      {
        id:
          "ir:stability",
        type:
          "CandidateArtifact",
        title:
          "Stability architecture",
        summary,
        confidence:
          1,
        evidenceRefs: [
          "evidence:stability",
        ],
        relationships:
          {},
        metadata:
          {},
        compiler: {
          compilerName:
            "documentation-compiler",
        },
        createdAt:
          1,
        updatedAt:
          1,
        status:
          "validated",
      },
    ],
    createdAt:
      1,
    updatedAt:
      2,
    metadata: {
      review: {
        decision:
          "approved",
        reviewerId:
          "reviewer:stability",
        reviewedAt:
          2,
        reason:
          "approved",
      },
      canonicalization: {
        canonicalizedAt:
          3000,
        canonicalItemIds: [
          "canonical:ir:stability",
        ],
      },
    },
  };
}


function withIsolatedCanonicalRoot(
  run: (
    root:
      string,
  ) => void,
): void {
  const previous =
    process.env
      .KORELUMINA_CANONICAL_ROOT;

  const root =
    mkdtempSync(
      path.join(
        os.tmpdir(),
        "korelumina-canonical-stability-",
      ),
    );

  process.env
    .KORELUMINA_CANONICAL_ROOT =
      root;

  try {
    run(
      root,
    );
  } finally {
    if (
      previous ===
        undefined
    ) {
      delete process.env
        .KORELUMINA_CANONICAL_ROOT;
    } else {
      process.env
        .KORELUMINA_CANONICAL_ROOT =
          previous;
    }

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
}


function snapshot(
  root:
    string,
): Record<
  string,
  string
> {
  return Object.fromEntries(
    readdirSync(
      root,
    )
      .sort()
      .map(
        name => [
          name,
          readFileSync(
            path.join(
              root,
              name,
            ),
            "utf8",
          ),
        ],
      ),
  );
}


function packages(
  ...list:
    ReturnType<
      typeof canonicalPackage
    >[]
) {
  return {
    list() {
      return list;
    },
  } as never;
}


test(
  "first rehydration stamps canonical items with the governed canonicalization time",
  () => {
    withIsolatedCanonicalRoot(
      () => {
        const [
          item,
        ] =
          rehydrateRuntimeCanonicalKnowledge(
            new KnowledgePlatform(),
            packages(
              canonicalPackage(),
            ),
          );

        assert.equal(
          item.createdAt,
          3000,
        );

        assert.equal(
          item.updatedAt,
          3000,
        );
      },
    );
  },
);


test(
  "repeated rehydration leaves persisted canonical files byte-for-byte unchanged",
  () => {
    withIsolatedCanonicalRoot(
      (
        root,
      ) => {
        rehydrateRuntimeCanonicalKnowledge(
          new KnowledgePlatform(),
          packages(
            canonicalPackage(),
          ),
        );

        const before =
          snapshot(
            root,
          );

        rehydrateRuntimeCanonicalKnowledge(
          new KnowledgePlatform(),
          packages(
            canonicalPackage(),
          ),
        );

        assert.deepEqual(
          snapshot(
            root,
          ),
          before,
        );
      },
    );
  },
);


test(
  "an existing persisted createdAt survives rehydration even when it differs from canonicalization time",
  () => {
    const rebuilt = {
      id:
        "canonical:x",
      createdAt:
        3000,
      updatedAt:
        3000,
      summary:
        "same",
    } as unknown as CanonicalKnowledgeItem;

    const persisted = {
      id:
        "canonical:x",
      createdAt:
        1111,
      updatedAt:
        2222,
      summary:
        "same",
    } as unknown as CanonicalKnowledgeItem;

    const result =
      preservePersistedTimestamps(
        rebuilt,
        persisted,
      );

    assert.equal(
      result.createdAt,
      1111,
    );

    assert.equal(
      result.updatedAt,
      2222,
    );
  },
);


test(
  "changed rebuilt content keeps the original createdAt and records a new updatedAt",
  () => {
    const persisted = {
      id:
        "canonical:x",
      createdAt:
        1111,
      updatedAt:
        2222,
      summary:
        "old",
    } as unknown as CanonicalKnowledgeItem;

    const rebuilt = {
      id:
        "canonical:x",
      createdAt:
        3000,
      updatedAt:
        3000,
      summary:
        "new",
    } as unknown as CanonicalKnowledgeItem;

    const before =
      Date.now();

    const result =
      preservePersistedTimestamps(
        rebuilt,
        persisted,
      );

    assert.equal(
      result.createdAt,
      1111,
    );

    assert.ok(
      result.updatedAt >=
        before,
    );

    assert.equal(
      result.summary,
      "new",
    );
  },
);


test(
  "an item with no persisted record is returned unchanged",
  () => {
    const rebuilt = {
      id:
        "canonical:x",
      createdAt:
        3000,
      updatedAt:
        3000,
    } as unknown as CanonicalKnowledgeItem;

    assert.equal(
      preservePersistedTimestamps(
        rebuilt,
        undefined,
      ),
      rebuilt,
    );
  },
);


/*
 * F-31: a canonical item promoted automatically under ADR-0042 carries its
 * review evidence and history in the persisted record, not in its package.
 * A Runtime restart (rehydration) must keep that record exactly.
 */
test(
  "rehydration never rewrites a persisted canonical item or drops its review history",
  () => {
    withIsolatedCanonicalRoot(
      (
        root,
      ) => {
        const platform =
          new KnowledgePlatform();

        const [rebuilt] =
          rehydrateRuntimeCanonicalKnowledge(
            platform,
            packages(
              canonicalPackage(),
            ),
          );

        const promoted: CanonicalKnowledgeItem = {
          ...rebuilt,
          metadata: {
            ...rebuilt.metadata,
            governance: {
              ...(rebuilt.metadata.governance as Record<string, unknown>),
              reviewEvidence: {
                packageId: "knowledge-package:stability",
                decision: "approved",
                reason: "governed-policy-execution:learning-records@1.0",
              },
              reviewHistory: [
                { decision: "approved", reason: "governed-policy-execution:learning-records@1.0" },
              ],
              lifecycleHistory: [
                { state: "approved", at: 2 },
              ],
            },
          },
        };

        platform.store.registerGoverned(
          promoted,
        );

        const before =
          snapshot(
            root,
          );

        const [after] =
          rehydrateRuntimeCanonicalKnowledge(
            new KnowledgePlatform(),
            packages(
              canonicalPackage(),
            ),
          );

        assert.deepEqual(
          snapshot(
            root,
          ),
          before,
          "the persisted file is untouched",
        );

        assert.deepEqual(
          (after.metadata.governance as Record<string, unknown>).reviewHistory,
          [{ decision: "approved", reason: "governed-policy-execution:learning-records@1.0" }],
        );
      },
    );
  },
);

test(
  "a canonical item missing from the store is restored from its package",
  () => {
    withIsolatedCanonicalRoot(
      (
        root,
      ) => {
        const items =
          rehydrateRuntimeCanonicalKnowledge(
            new KnowledgePlatform(),
            packages(
              canonicalPackage(),
            ),
          );

        assert.equal(items.length, 1);
        assert.equal(Object.keys(snapshot(root)).length, 1);
      },
    );
  },
);
