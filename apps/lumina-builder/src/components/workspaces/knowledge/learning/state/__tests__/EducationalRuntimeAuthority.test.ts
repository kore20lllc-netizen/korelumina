import assert from "node:assert/strict";
import test from "node:test";

import {
  runtimeCompatibleDashboard,
} from "../EducationalRuntimeCompatibility";


test(
  "authoritative empty Runtime Education collections remain empty",
  () => {
    const result =
      runtimeCompatibleDashboard({
        state:
          "success",

        artifacts:
          [],

        modules:
          [],

        competencies:
          [],

        timeline:
          [],
      });

    assert.deepEqual(
      result.artifacts,
      [],
    );

    assert.deepEqual(
      result.competencies,
      [],
    );

    assert.deepEqual(
      result.timeline,
      [],
    );
  },
);


test(
  "Runtime state remains authoritative after successful load",
  () => {
    const result =
      runtimeCompatibleDashboard({
        state:
          "warning",

        artifacts:
          [],

        modules:
          [],

        competencies:
          [],

        timeline:
          [],
      });

    assert.equal(
      result.state,
      "warning",
    );
  },
);
