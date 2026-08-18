import assert from "node:assert/strict";
import test from "node:test";

import {
  KnowledgeEducationProjectionService,
} from "../KnowledgeEducationProjectionService.js";

function canonicalItem(
  overrides:
    Record<string, unknown>,
) {
  const now =
    Date.now();

  return {
    id:
      "canonical:document:governed",

    type:
      "CandidateArtifact",

    title:
      "Governed educational knowledge",

    summary:
      "Approved primary canonical knowledge.",

    confidence:
      1,

    evidenceRefs: [
      "evidence:governed",
    ],

    relationships:
      {},

    createdAt:
      now,

    updatedAt:
      now,

    status:
      "canonical",

    metadata: {
      source:
        "repository",

      approvalState:
        "approved",
    },

    ...overrides,
  } as never;
}

test(
  "certified Education projection preserves complete UI contract",
  () => {
    const service =
      new KnowledgeEducationProjectionService(
        {
          list:
            () => [
              canonicalItem(
                {},
              ),
            ],
        },
      );

    const snapshot =
      service.snapshot();

    assert.equal(
      snapshot.state,
      "success",
    );

    assert.equal(
      snapshot.source,
      "canonical-knowledge",
    );

    assert.equal(
      snapshot.modules.length,
      5,
    );

    assert.equal(
      snapshot.competencies.length,
      7,
    );

    assert.equal(
      snapshot.artifacts.length,
      1,
    );

    assert.equal(
      snapshot.timeline.length,
      1,
    );
  },
);

test(
  "certified Education admission rejects non-production canonical knowledge",
  () => {
    const service =
      new KnowledgeEducationProjectionService(
        {
          list:
            () => [
              canonicalItem(
                {
                  id:
                    "canonical:primary:approved",
                },
              ),

              canonicalItem(
                {
                  id:
                    "canonical:test:artifact",
                },
              ),

              canonicalItem(
                {
                  id:
                    "canonical:certification:artifact",
                },
              ),

              canonicalItem(
                {
                  id:
                    "canonical:pending",

                  metadata: {
                    source:
                      "repository",

                    approvalState:
                      "pending-review",
                  },
                },
              ),

              canonicalItem(
                {
                  id:
                    "canonical:superseded",

                  status:
                    "superseded",
                },
              ),

              canonicalItem(
                {
                  id:
                    "canonical:derived",

                  metadata: {
                    approvalState:
                      "approved",
                  },
                },
              ),
            ],
        },
      );

    assert.deepEqual(
      service
        .snapshot()
        .artifacts
        .map(
          (artifact) =>
            artifact.id,
        ),
      [
        "canonical:primary:approved",
      ],
    );
  },
);

test(
  "derived canonical knowledge requires explicit Education eligibility",
  () => {
    const service =
      new KnowledgeEducationProjectionService(
        {
          list:
            () => [
              canonicalItem(
                {
                  id:
                    "canonical:derived:implicit",

                  metadata: {
                    source:
                      "canonical-knowledge",

                    approvalState:
                      "approved",
                  },
                },
              ),

              canonicalItem(
                {
                  id:
                    "canonical:derived:explicit",

                  metadata: {
                    source:
                      "canonical-knowledge",

                    approvalState:
                      "approved",

                    educationEligible:
                      true,
                  },
                },
              ),
            ],
        },
      );

    assert.deepEqual(
      service
        .snapshot()
        .artifacts
        .map(
          (artifact) =>
            artifact.id,
        ),
      [
        "canonical:derived:explicit",
      ],
    );
  },
);

test(
  "legacy canonical records cannot crash certified Education",
  () => {
    const service =
      new KnowledgeEducationProjectionService(
        {
          list:
            () => [
              {
                id:
                  "canonical:legacy:historical",

                title:
                  "Historical record",

                summary:
                  "Legacy persisted data.",

                confidence:
                  0.8,

                status:
                  "canonical",
              } as never,
            ],
        },
      );

    assert.doesNotThrow(
      () =>
        service.snapshot(),
    );

    const snapshot =
      service.snapshot();

    assert.equal(
      snapshot.state,
      "success",
    );

    assert.deepEqual(
      snapshot.artifacts,
      [],
    );

    assert.equal(
      snapshot.modules.length,
      5,
    );

    assert.equal(
      snapshot.competencies.length,
      7,
    );
  },
);
