import assert from "node:assert/strict";
import test from "node:test";

import {
  KnowledgeEducationProjectionService,
} from "../KnowledgeEducationProjectionService.js";


test(
  "M51.5a mission-boundaries does not claim curriculum admission when the Educational Corpus has no mission artifact",
  () => {
    const service =
      new KnowledgeEducationProjectionService({
        list:
          () => [],
      });

    const snapshot =
      service.snapshot();

    const competency =
      snapshot.competencies.find(
        item =>
          item.id ===
          "mission-boundaries",
      );

    assert.ok(
      competency,
      "certified mission-boundaries topology must remain present",
    );

    assert.equal(
      competency.status,
      "not-started",
    );

    assert.equal(
      competency.evidence,
      "Mission curriculum is not present in the current Educational Corpus.",
    );

    assert.notEqual(
      competency.evidence,
      "Mission curriculum admitted but not fully reviewed.",
    );
  },
);


test(
  "M51.5a does not alter unrelated competency topology when mission curriculum is absent",
  () => {
    const service =
      new KnowledgeEducationProjectionService({
        list:
          () => [],
      });

    const snapshot =
      service.snapshot();

    assert.equal(
      snapshot.competencies.length,
      7,
    );

    const approvalBoundaries =
      snapshot.competencies.find(
        item =>
          item.id ===
          "approval-boundaries",
      );

    assert.ok(
      approvalBoundaries,
    );

    /*
     * M51.5a is deliberately scoped to the proven
     * mission-boundaries contradiction.
     *
     * Approval-boundaries remains untouched unless
     * independent Runtime evidence proves the same defect.
     */
    assert.notEqual(
      approvalBoundaries.id,
      "mission-boundaries",
    );
  },
);
