import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveRuntimeTruthCompetencyEvidence,
} from "../RuntimeTruthCompetencyEvidenceAdapter.js";


test(
  "authoritative Runtime observation produces pending runtime-truth competency evidence",
  () => {
    const assessment =
      deriveRuntimeTruthCompetencyEvidence({
        observedAt:
          200,

        sourceRef:
          "/api/runtime/status/demo-project",

        runtime: {
          projectId:
            "demo-project",

          framework:
            "nextjs",

          port:
            4201,

          pid:
            1234,

          startedAt:
            100,

          url:
            "http://localhost:4201",

          logs:
            [],

          status:
            "running",
        },
      });

    assert.equal(
      assessment.eligible,
      true,
    );

    assert.deepEqual(
      assessment.missingRequirements,
      [],
    );

    assert.equal(
      assessment.evidence?.competencyId,
      "runtime-truth-distinction",
    );

    assert.equal(
      assessment.evidence?.source,
      "runtime",
    );

    assert.equal(
      assessment.evidence?.sourceRef,
      "/api/runtime/status/demo-project",
    );

    assert.equal(
      assessment.evidence?.validationState,
      "PENDING",
    );

    assert.equal(
      assessment.evidence?.validatedBy,
      null,
    );
  },
);


test(
  "Runtime observation without authoritative identity cannot produce competency evidence",
  () => {
    const assessment =
      deriveRuntimeTruthCompetencyEvidence({
        observedAt:
          200,

        sourceRef:
          "",

        runtime: {
          projectId:
            "",

          framework:
            "nextjs",

          port:
            4201,

          startedAt:
            100,

          url:
            "http://localhost:4201",

          logs:
            [],

          status:
            "running",
        },
      });

    assert.equal(
      assessment.eligible,
      false,
    );

    assert.equal(
      assessment.evidence,
      null,
    );

    assert.ok(
      assessment
        .missingRequirements
        .includes(
          "project-id",
        ),
    );

    assert.ok(
      assessment
        .missingRequirements
        .includes(
          "runtime-source-ref",
        ),
    );
  },
);


test(
  "invalid Runtime lifecycle observation cannot manufacture runtime-truth competency evidence",
  () => {
    const assessment =
      deriveRuntimeTruthCompetencyEvidence({
        observedAt:
          0,

        sourceRef:
          "/api/runtime/status/demo-project",

        runtime: {
          projectId:
            "demo-project",

          framework:
            "",

          port:
            0,

          startedAt:
            0,

          url:
            "",

          logs:
            [],

          status:
            "running",
        },
      });

    assert.equal(
      assessment.eligible,
      false,
    );

    assert.equal(
      assessment.evidence,
      null,
    );

    assert.deepEqual(
      assessment.missingRequirements,
      [
        "observation-time",
        "runtime-framework",
        "runtime-port",
        "runtime-started-at",
      ],
    );
  },
);
