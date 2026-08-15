import assert from "node:assert/strict";
import test from "node:test";

import {
  KnowledgeEducationProjectionService,
} from "../KnowledgeEducationProjectionService.js";

const CERTIFIED_MODULE_CONTRACT = [
  {
    id:
      "constitutional-literacy",
    status:
      "completed",
    completion:
      100,
  },
  {
    id:
      "knowledge-governance",
    status:
      "completed",
    completion:
      100,
  },
  {
    id:
      "operational-boundaries",
    status:
      "active",
    completion:
      78,
  },
  {
    id:
      "conversation-curriculum",
    status:
      "active",
    completion:
      64,
  },
  {
    id:
      "business-domain-literacy",
    status:
      "blocked",
    completion:
      32,
  },
] as const;

const CERTIFIED_COMPETENCY_CONTRACT = [
  {
    id:
      "authority-interpretation",
    status:
      "completed",
  },
  {
    id:
      "governed-retrieval",
    status:
      "active",
  },
  {
    id:
      "provenance-preservation",
    status:
      "completed",
  },
  {
    id:
      "runtime-truth-distinction",
    status:
      "active",
  },
  {
    id:
      "mission-boundaries",
    status:
      "needs-review",
  },
  {
    id:
      "approval-boundaries",
    status:
      "completed",
  },
  {
    id:
      "explainable-grounding",
    status:
      "blocked",
  },
] as const;

function createService() {
  return new KnowledgeEducationProjectionService(
    {
      list:
        () => [],
    },
  );
}

test(
  "runtime preserves the certified Educational Progress contract",
  () => {
    const snapshot =
      createService()
        .snapshot();

    assert.equal(
      snapshot.state,
      "success",
      "runtime must preserve the certified Education workspace mounting state",
    );

    assert.equal(
      snapshot.modules.length,
      CERTIFIED_MODULE_CONTRACT.length,
    );

    assert.deepEqual(
      snapshot.modules.map(
        (module) => ({
          id:
            module.id,
          status:
            module.status,
          completion:
            module.completion,
        }),
      ),
      CERTIFIED_MODULE_CONTRACT,
    );
  },
);

test(
  "runtime preserves the certified Competency Posture contract",
  () => {
    const snapshot =
      createService()
        .snapshot();

    assert.equal(
      snapshot.competencies.length,
      CERTIFIED_COMPETENCY_CONTRACT.length,
    );

    assert.deepEqual(
      snapshot.competencies.map(
        (competency) => ({
          id:
            competency.id,
          status:
            competency.status,
        }),
      ),
      CERTIFIED_COMPETENCY_CONTRACT,
    );
  },
);

test(
  "runtime curriculum preserves required UI fields",
  () => {
    const snapshot =
      createService()
        .snapshot();

    for (
      const module
      of snapshot.modules
    ) {
      assert.ok(
        module.id.length >
          0,
      );

      assert.ok(
        module.title.length >
          0,
      );

      assert.ok(
        module.description.length >
          0,
      );

      assert.ok(
        module.completion >=
          0 &&
        module.completion <=
          100,
      );

      assert.ok(
        Array.isArray(
          module.dependencyIds,
        ),
      );

      assert.ok(
        module.competencyObjectives.length >
          0,
      );
    }

    for (
      const competency
      of snapshot.competencies
    ) {
      assert.ok(
        competency.id.length >
          0,
      );

      assert.ok(
        competency.title.length >
          0,
      );

      assert.ok(
        competency.description.length >
          0,
      );

      assert.ok(
        competency.evidence.length >
          0,
      );
    }
  },
);
