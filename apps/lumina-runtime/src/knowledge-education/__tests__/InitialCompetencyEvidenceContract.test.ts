import assert from "node:assert/strict";
import test from "node:test";

import {
  createInitialCompetencyEvidenceRecord,
  evidenceRequirementsForCompetency,
  initialCompetencyEvidenceRequirements,
} from "../InitialCompetencyEvidenceContract.js";


test(
  "unresolved initial competency domains have explicit evidence requirements",
  () => {
    assert.deepEqual(
      initialCompetencyEvidenceRequirements
        .map(
          requirement =>
            requirement.competencyId,
        )
        .sort(),
      [
        "explainable-grounding",
        "governed-retrieval",
        "mission-boundaries",
        "runtime-truth-distinction",
      ],
    );
  },
);


test(
  "runtime truth competency requires authoritative runtime or human-review evidence",
  () => {
    const requirements =
      evidenceRequirementsForCompetency(
        "runtime-truth-distinction",
      );

    assert.equal(
      requirements.length,
      1,
    );

    assert.deepEqual(
      requirements[0].acceptedSources,
      [
        "runtime",
        "human-review",
      ],
    );
  },
);


test(
  "validated competency evidence requires validation identity and timestamp",
  () => {
    assert.throws(
      () =>
        createInitialCompetencyEvidenceRecord({
          evidenceId:
            "competency-evidence:runtime:1",

          competencyId:
            "runtime-truth-distinction",

          source:
            "runtime",

          sourceRef:
            "runtime-certification:1",

          claim:
            "Operational state was verified against Runtime.",

          observedAt:
            1,

          validationState:
            "VALIDATED",
        }),
      /initial_competency_evidence_validation_proof_required/,
    );

    const evidence =
      createInitialCompetencyEvidenceRecord({
        evidenceId:
          "competency-evidence:runtime:1",

        competencyId:
          "runtime-truth-distinction",

        source:
          "runtime",

        sourceRef:
          "runtime-certification:1",

        claim:
          "Operational state was verified against Runtime.",

        observedAt:
          1,

        validationState:
          "VALIDATED",

        validatedBy:
          "human-governance",

        validatedAt:
          2,
      });

    assert.equal(
      evidence.validationState,
      "VALIDATED",
    );

    assert.equal(
      evidence.validatedBy,
      "human-governance",
    );
  },
);


test(
  "new competency evidence defaults to pending and cannot manufacture competency completion",
  () => {
    const evidence =
      createInitialCompetencyEvidenceRecord({
        evidenceId:
          "competency-evidence:retrieval:1",

        competencyId:
          "governed-retrieval",

        source:
          "canonical-knowledge",

        sourceRef:
          "canonical:item:1",

        claim:
          "Authority and provenance were preserved during retrieval.",

        observedAt:
          1,
      });

    assert.equal(
      evidence.validationState,
      "PENDING",
    );

    assert.equal(
      evidence.validatedBy,
      null,
    );

    assert.equal(
      evidence.validatedAt,
      null,
    );

    assert.equal(
      "competencyStatus" in evidence,
      false,
      "evidence records must not directly manufacture competency status",
    );
  },
);
