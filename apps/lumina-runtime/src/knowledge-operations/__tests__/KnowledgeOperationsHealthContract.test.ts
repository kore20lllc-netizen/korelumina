import assert from "node:assert/strict";
import test from "node:test";

import {
  KnowledgeOperationsService,
} from "../KnowledgeOperationsService.js";

test(
  "Knowledge Health is explicitly unmeasured until a governed scoring contract exists",
  () => {
    const snapshot =
      new KnowledgeOperationsService()
        .getSnapshot();

    assert.equal(
      snapshot.summary.healthScore,
      null,
    );
  },
);
