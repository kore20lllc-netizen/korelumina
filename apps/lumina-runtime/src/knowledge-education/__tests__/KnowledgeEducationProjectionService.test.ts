import assert from "node:assert/strict";
import test from "node:test";

import {
  KnowledgeEducationProjectionService,
} from "../KnowledgeEducationProjectionService.js";

test(
  "education projection preserves certified curriculum composition while sourcing artifacts from canonical knowledge",
  () => {
    const service =
      new KnowledgeEducationProjectionService(
        {
          list:
            () => [
              {
                id:
                  "canonical:education:governed-decision",

                type:
                  "CandidateDecision",

                title:
                  "Governed decision",

                summary:
                  "A governed canonical decision.",

                confidence:
                  0.99,

                evidenceRefs: [
                  "evidence:governed-decision",
                ],

                relationships:
                  {
                    dependsOn: [
                      "canonical:dependency",
                    ],
                  },

                createdAt:
                  100,

                updatedAt:
                  200,

                status:
                  "canonical",

                metadata:
                  {
                    authorityClass:
                      "constitutional",

                    owner:
                      "Knowledge Operations",

                    scope:
                      "platform",

                    version:
                      "1.0.0",

                    source:
                      "documentation",

                    lineage: [
                      "genesis",
                    ],

                    dependencies: [
                      "canonical:dependency",
                    ],
                  },
              },
            ],
        },
      );

    const snapshot =
      service.snapshot();

    assert.equal(
      snapshot.source,
      "canonical-knowledge",
    );

    assert.equal(
      snapshot.state,
      "success",
    );

    assert.equal(
      snapshot.artifacts.length,
      1,
    );

    assert.equal(
      snapshot.artifacts[0].id,
      "canonical:education:governed-decision",
    );

    assert.equal(
      snapshot.modules.length,
      5,
    );

    assert.deepEqual(
      snapshot.modules.map(
        (module) =>
          module.id,
      ),
      [
        "constitutional-literacy",
        "knowledge-governance",
        "operational-boundaries",
        "conversation-curriculum",
        "business-domain-literacy",
      ],
    );

    assert.deepEqual(
      snapshot.modules.map(
        (module) =>
          module.completion,
      ),
      [
        100,
        100,
        78,
        64,
        32,
      ],
    );

    assert.equal(
      snapshot.competencies.length,
      7,
    );

    assert.equal(
      snapshot.timeline.length,
      1,
    );

    assert.equal(
      snapshot.timeline[0].type,
      "admission",
    );
  },
);

test(
  "empty canonical corpus preserves the certified Education UI composition",
  () => {
    const service =
      new KnowledgeEducationProjectionService(
        {
          list:
            () => [],
        },
      );

    const snapshot =
      service.snapshot();

    assert.equal(
      snapshot.state,
      "success",
      "canonical corpus absence must not alter the certified Education UI composition",
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

test(
  "legacy persisted canonical items cannot crash the Education projection",
  () => {
    const service =
      new KnowledgeEducationProjectionService(
        {
          list:
            () => [
              {
                id:
                  "canonical:legacy:historical",

                type:
                  undefined,

                title:
                  "Legacy canonical artifact",

                summary:
                  "Historical persisted knowledge.",

                confidence:
                  0.8,

                evidenceRefs:
                  undefined,

                relationships:
                  undefined,

                createdAt:
                  undefined,

                updatedAt:
                  undefined,

                status:
                  "canonical",

                metadata:
                  undefined,
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

    assert.equal(
      snapshot.artifacts.length,
      0,
      "legacy canonical item with no declared primary source must be safely excluded from Education",
    );

    assert.equal(
      snapshot.timeline.length,
      0,
      "excluded legacy canonical knowledge must not generate Education timeline events",
    );
  },
);

test(
  "education projection excludes certification and test canonical artifacts",
  () => {
    const now =
      Date.now();

    const service =
      new KnowledgeEducationProjectionService(
        {
          list:
            () => [
              {
                id:
                  "canonical:production",

                type:
                  "CandidateDecision",

                title:
                  "Production knowledge",

                summary:
                  "Approved production knowledge.",

                confidence:
                  0.99,

                evidenceRefs:
                  [
                    "evidence:production",
                  ],

                relationships:
                  {},

                createdAt:
                  now,

                updatedAt:
                  now,

                status:
                  "canonical",

                metadata:
                  {
                    source:
                      "documentation",
                  },
              },

              {
                id:
                  "canonical:certification",

                type:
                  "CandidateArtifact",

                title:
                  "Certification artifact",

                summary:
                  "Must not appear in Education.",

                confidence:
                  1,

                evidenceRefs:
                  [
                    "evidence:certification",
                  ],

                relationships:
                  {},

                createdAt:
                  now,

                updatedAt:
                  now,

                status:
                  "canonical",

                metadata:
                  {
                    source:
                      "evidence-intake-certification",
                  },
              },

              {
                id:
                  "canonical:test",

                type:
                  "CandidateArtifact",

                title:
                  "Test artifact",

                summary:
                  "Must not appear in Education.",

                confidence:
                  1,

                evidenceRefs:
                  [
                    "evidence:governed-decision",
                  ],

                relationships:
                  {},

                createdAt:
                  now,

                updatedAt:
                  now,

                status:
                  "canonical",

                metadata:
                  {
                    environment:
                      "test",
                  },
              },
            ],
        },
      );

    const snapshot =
      service.snapshot();

    assert.deepEqual(
      snapshot.artifacts.map(
        (artifact) =>
          artifact.id,
      ),
      [
        "canonical:production",
      ],
    );
  },
);

test(
  "education projection excludes superseded and archived canonical records",
  () => {
    const now =
      Date.now();

    const service =
      new KnowledgeEducationProjectionService(
        {
          list:
            () => [
              {
                id:
                  "canonical:active",

                type:
                  "CandidateDecision",

                title:
                  "Active knowledge",

                summary:
                  "Current canonical knowledge.",

                confidence:
                  1,

                evidenceRefs:
                  [],

                relationships:
                  {},

                createdAt:
                  now,

                updatedAt:
                  now,

                status:
                  "canonical",

                metadata:
                  {
                    source:
                      "repository",

                    approvalState:
                      "approved",
                  },
              },

              {
                id:
                  "canonical:superseded",

                type:
                  "CandidateDecision",

                title:
                  "Superseded knowledge",

                summary:
                  "Historical.",

                confidence:
                  1,

                evidenceRefs:
                  [],

                relationships:
                  {},

                createdAt:
                  now,

                updatedAt:
                  now,

                status:
                  "superseded",

                metadata:
                  {
                    source:
                      "repository",

                    approvalState:
                      "approved",
                  },
              },

              {
                id:
                  "canonical:archived",

                type:
                  "CandidateDecision",

                title:
                  "Archived knowledge",

                summary:
                  "Historical.",

                confidence:
                  1,

                evidenceRefs:
                  [],

                relationships:
                  {},

                createdAt:
                  now,

                updatedAt:
                  now,

                status:
                  "archived",

                metadata:
                  {
                    source:
                      "repository",

                    approvalState:
                      "approved",
                  },
              },
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
        "canonical:active",
      ],
    );
  },
);

test(
  "education admission rejects synthetic ids, evidence refs and pending approval",
  () => {
    const now =
      Date.now();

    const base = {
      type:
        "CandidateArtifact" as const,

      summary:
        "Synthetic admission-policy test.",

      confidence:
        1,

      relationships:
        {},

      createdAt:
        now,

      updatedAt:
        now,

      status:
        "canonical" as const,
    };

    const service =
      new KnowledgeEducationProjectionService(
        {
          list:
            () => [
              {
                ...base,

                id:
                  "canonical:valid:architecture",

                title:
                  "Valid architecture",

                evidenceRefs: [
                  "evidence:architecture",
                ],

                metadata: {
                  source:
                    "repository",

                  approvalState:
                    "approved",
                },
              },

              {
                ...base,

                id:
                  "canonical:document:evidence:test",

                title:
                  "Test evidence",

                evidenceRefs: [
                  "evidence:governed-decision",
                ],

                metadata: {
                  approvalState:
                    "approved",
                },
              },

              {
                ...base,

                id:
                  "canonical:candidate:test-candidate",

                title:
                  "Synthetic candidate",

                evidenceRefs:
                  [],

                metadata: {
                  approvalState:
                    "approved",
                },
              },

              {
                ...base,

                id:
                  "canonical:pending",

                title:
                  "Pending review",

                evidenceRefs: [
                  "evidence:pending",
                ],

                metadata: {
                  source:
                    "repository",

                  approvalState:
                    "pending-review",
                },
              },

              {
                ...base,

                id:
                  "canonical:governance-test",

                title:
                  "Governance test",

                evidenceRefs: [
                  "evidence:architecture",
                ],

                metadata: {
                  governance: {
                    reviewDecision:
                      "approved",

                    sourceEvidenceRefs: [
                      "evidence:test",
                    ],
                  },
                },
              },
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
        "canonical:valid:architecture",
      ],
    );
  },
);

test(
  "derived canonical knowledge requires explicit educational admission",
  () => {
    const now =
      Date.now();

    const base = {
      type:
        "CandidateArtifact" as const,

      summary:
        "Derived canonical knowledge.",

      confidence:
        1,

      evidenceRefs:
        [
          "evidence:derived",
        ],

      relationships:
        {},

      createdAt:
        now,

      updatedAt:
        now,

      status:
        "canonical" as const,
    };

    const service =
      new KnowledgeEducationProjectionService(
        {
          list:
            () => [
              {
                ...base,

                id:
                  "canonical:derived:implicit",

                title:
                  "Implicit derived knowledge",

                metadata: {
                  source:
                    "canonical-knowledge",

                  approvalState:
                    "approved",
                },
              },

              {
                ...base,

                id:
                  "canonical:derived:eligible",

                title:
                  "Explicit educational knowledge",

                metadata: {
                  source:
                    "canonical-knowledge",

                  approvalState:
                    "approved",

                  educationEligible:
                    true,
                },
              },

              {
                ...base,

                id:
                  "canonical:primary:repository",

                title:
                  "Primary governed knowledge",

                metadata: {
                  source:
                    "repository",

                  approvalState:
                    "approved",
                },
              },
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
        "canonical:derived:eligible",
        "canonical:primary:repository",
      ],
    );
  },
);

test(
  "canonical item without declared source is treated as internally derived knowledge",
  () => {
    const now =
      Date.now();

    const service =
      new KnowledgeEducationProjectionService(
        {
          list:
            () => [
              {
                id:
                  "canonical:candidate:internal-derived",

                type:
                  "CandidateArtifact",

                title:
                  "Internal derived candidate",

                summary:
                  "Derived canonical record with no explicit source.",

                confidence:
                  1,

                evidenceRefs: [
                  "evidence:candidate:internal-derived",
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
                  approvalState:
                    "approved",
                },
              },

              {
                id:
                  "canonical:document:primary",

                type:
                  "CandidateArtifact",

                title:
                  "Primary repository knowledge",

                summary:
                  "Primary governed source.",

                confidence:
                  1,

                evidenceRefs: [
                  "evidence:primary",
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
              },
            ],
        },
      );

    const snapshot =
      service.snapshot();

    assert.deepEqual(
      snapshot.artifacts.map(
        (artifact) =>
          artifact.id,
      ),
      [
        "canonical:document:primary",
      ],
    );
  },
);
