import assert from "node:assert/strict";
import test from "node:test";

import type {
  CanonicalKnowledgeItem,
} from "../../../canonical-knowledge/index.js";

import {
  projectEducationalArtifact,
} from "../EducationalArtifactProjector.js";


function canonicalItem(
  metadata:
    Record<string, unknown>,
): CanonicalKnowledgeItem {
  return {
    id:
      "canonical:test",

    type:
      "CandidateArtifact",

    title:
      "Governed document",

    summary:
      "Governed document projection fixture.",

    confidence:
      1,

    evidenceRefs: [
      "evidence:test",
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
      approvalState:
        "approved",

      owner:
        "Constitutional Office",

      scope:
        "Organization-wide",

      version:
        "1.0.0",

      ...metadata,
    },
  };
}


test(
  "projects governed canonical document classification as canon",
  () => {
    const projected =
      projectEducationalArtifact(
        canonicalItem({
          authorityClass:
            "Supreme",

          documentClassification:
            "canonical",
        }),
      );

    assert.equal(
      projected.kind,
      "canon",
    );
  },
);


test(
  "projects constitutional amendment authority as amendment",
  () => {
    const projected =
      projectEducationalArtifact(
        canonicalItem({
          authorityClass:
            "Constitutional Amendment",

          documentClassification:
            "architecture",
        }),
      );

    assert.equal(
      projected.kind,
      "amendment",
    );
  },
);


test(
  "projects Blueprint classification as governing architecture",
  () => {
    const projected =
      projectEducationalArtifact(
        canonicalItem({
          authorityClass:
            "Architecture",

          documentClassification:
            "blueprint",
        }),
      );

    assert.equal(
      projected.kind,
      "architecture",
    );
  },
);


test(
  "preserves generic fallback when no governed document classification exists",
  () => {
    const projected =
      projectEducationalArtifact(
        canonicalItem({
          authorityClass:
            "Architecture",
        }),
      );

    assert.equal(
      projected.kind,
      "knowledge-operations",
    );
  },
);


test(
  "projects governed Repository Knowledge Seeding source as architecture curriculum",
  () => {
    const projected =
      projectEducationalArtifact(
        canonicalItem({
          authorityClass:
            "constitutional",

          sourceLocation:
            "docs/architecture/KORELUMINA_REPOSITORY_KNOWLEDGE_SEEDING_V1.md",
        }),
      );

    assert.equal(
      projected.kind,
      "architecture",
    );

    assert.deepEqual(
      projected.sourceRefs,
      [
        "docs/architecture/KORELUMINA_REPOSITORY_KNOWLEDGE_SEEDING_V1.md",
      ],
    );
  },
);
