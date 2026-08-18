import assert from "node:assert/strict";
import test from "node:test";

import {
  KnowledgeEducationProjectionService,
} from "../KnowledgeEducationProjectionService.js";

const CERTIFIED_MODULE_IDS = [
  "constitutional-literacy",
  "knowledge-governance",
  "operational-boundaries",
  "conversation-curriculum",
  "business-domain-literacy",
] as const;

const CERTIFIED_COMPETENCY_IDS = [
  "authority-interpretation",
  "governed-retrieval",
  "provenance-preservation",
  "runtime-truth-distinction",
  "mission-boundaries",
  "approval-boundaries",
  "explainable-grounding",
] as const;

function createEmptyService() {
  return new KnowledgeEducationProjectionService(
    {
      list:
        () => [],
    },
  );
}

test(
  "runtime preserves the certified Educational Progress topology",
  () => {
    const snapshot =
      createEmptyService()
        .snapshot();

    assert.equal(
      snapshot.state,
      "success",
    );

    assert.deepEqual(
      snapshot.modules.map(
        (module) =>
          module.id,
      ),
      CERTIFIED_MODULE_IDS,
    );

    for (
      const module
      of snapshot.modules
    ) {
      assert.equal(
        module.completion,
        0,
        `${module.id} must not manufacture progress when governed curriculum is absent`,
      );

      assert.equal(
        module.coverage.satisfiedCount,
        0,
      );

      assert.equal(
        module.coverage.measurementVersion,
        "education-coverage-v1",
      );

      assert.equal(
        module.coverage.requirementCount >
          0,
        true,
        `${module.id} must have explicit measurable curriculum requirements`,
      );
    }
  },
);

test(
  "runtime preserves the certified Competency Posture topology",
  () => {
    const snapshot =
      createEmptyService()
        .snapshot();

    assert.deepEqual(
      snapshot.competencies.map(
        (competency) =>
          competency.id,
      ),
      CERTIFIED_COMPETENCY_IDS,
    );
  },
);
