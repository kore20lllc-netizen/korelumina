import assert from "node:assert/strict";
import test from "node:test";

import {
  buildInitialCompetencyAssessmentCandidate,
} from "../InitialCompetencyAssessmentCandidate.js";

import type {
  EducationalCorpusCertificationRuntimeProjection,
} from "../EducationalCorpusCertificationService.js";

import type {
  KnowledgeEducationSnapshot,
} from "../KnowledgeEducationProjectionService.js";

import {
  createInitialCompetencyEvidenceRecord,
} from "../InitialCompetencyEvidenceContract.js";


function certification():
  EducationalCorpusCertificationRuntimeProjection {
  return {
    state:
      "VALID",

    certification: {
      certificationId:
        "educational-corpus-certification:test",
    },
  } as unknown as
    EducationalCorpusCertificationRuntimeProjection;
}


function education():
  KnowledgeEducationSnapshot {
  return {
    state:
      "success",

    artifacts:
      [],

    modules:
      [],

    competencies: [
      {
        id:
          "governed-retrieval",

        title:
          "Governed Retrieval",

        description:
          "Demonstrate governed retrieval with preserved authority, approval, scope, and provenance.",

        status:
          "active",

        evidence:
          "Retrieval exercise remains.",
      },

      {
        id:
          "runtime-truth-distinction",

        title:
          "Runtime Truth Distinction",

        description:
          "Demonstrate that operational truth is verified against authoritative Runtime state.",

        status:
          "active",

        evidence:
          "Runtime verification remains.",
      },

      {
        id:
          "mission-boundaries",

        title:
          "Mission Boundaries",

        description:
          "Demonstrate correct mission ownership, delegation, execution boundaries, and human approval.",

        status:
          "not-started",

        evidence:
          "Mission evidence remains.",
      },
    ],

    timeline:
      [],

    generatedAt:
      1,

    source:
      "canonical-knowledge",
  } as KnowledgeEducationSnapshot;
}


test(
  "M51.5j3 validated evidence resolves only its matching competency",
  () => {
    const governed =
      createInitialCompetencyEvidenceRecord({
        evidenceId:
          "evidence:governed",

        competencyId:
          "governed-retrieval",

        source:
          "canonical-knowledge",

        sourceRef:
          "canonical:test",

        claim:
          "Governed retrieval demonstrated.",

        observedAt:
          10,

        validationState:
          "VALIDATED",

        validatedBy:
          "human-review:test",

        validatedAt:
          20,
      });

    const runtime =
      createInitialCompetencyEvidenceRecord({
        evidenceId:
          "evidence:runtime",

        competencyId:
          "runtime-truth-distinction",

        source:
          "runtime",

        sourceRef:
          "/api/runtime/status",

        claim:
          "Runtime truth distinction demonstrated.",

        observedAt:
          11,

        validationState:
          "VALIDATED",

        validatedBy:
          "human-review:test",

        validatedAt:
          21,
      });

    const candidate =
      buildInitialCompetencyAssessmentCandidate({
        education:
          education(),

        corpusCertification:
          certification(),

        evidence: [
          governed,
          runtime,
        ],
      });

    assert.deepEqual(
      candidate.completedCompetencyIds,
      [
        "governed-retrieval",
        "runtime-truth-distinction",
      ],
    );

    assert.deepEqual(
      candidate.unresolvedCompetencyIds,
      [
        "mission-boundaries",
      ],
    );

    assert.equal(
      candidate.state,
      "INCOMPLETE",
    );

    assert.equal(
      candidate.humanReview.available,
      false,
    );
  },
);


test(
  "M51.5j3 pending or rejected evidence does not resolve competency",
  () => {
    const pending =
      createInitialCompetencyEvidenceRecord({
        evidenceId:
          "evidence:pending",

        competencyId:
          "governed-retrieval",

        source:
          "canonical-knowledge",

        sourceRef:
          "canonical:test",

        claim:
          "Pending evidence.",

        observedAt:
          10,
      });

    const rejected =
      createInitialCompetencyEvidenceRecord({
        evidenceId:
          "evidence:rejected",

        competencyId:
          "runtime-truth-distinction",

        source:
          "runtime",

        sourceRef:
          "/api/runtime/status",

        claim:
          "Rejected evidence.",

        observedAt:
          11,

        validationState:
          "REJECTED",

        validatedBy:
          "human-review:test",

        validatedAt:
          21,
      });

    const candidate =
      buildInitialCompetencyAssessmentCandidate({
        education:
          education(),

        corpusCertification:
          certification(),

        evidence: [
          pending,
          rejected,
        ],
      });

    assert.equal(
      candidate.completedCompetencyIds.length,
      0,
    );

    assert.deepEqual(
      candidate.unresolvedCompetencyIds,
      [
        "governed-retrieval",
        "mission-boundaries",
        "runtime-truth-distinction",
      ],
    );
  },
);
