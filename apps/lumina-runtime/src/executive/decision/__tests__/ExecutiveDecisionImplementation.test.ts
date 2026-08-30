import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  ExecutiveDecisionService,
} from "../ExecutiveDecisionService.js";


const id =
  "executive-decision:implementation-test";

const file =
  path.resolve(
    process.cwd(),
    "runtime/executive/decisions",
    `${encodeURIComponent(
      id,
    )}.json`,
  );


function cleanup(): void {
  fs.rmSync(
    file,
    {
      force:
        true,
    },
  );
}


test(
  "implements an approved decision durably and merges execution metadata",
  () => {
    cleanup();

    const first =
      new ExecutiveDecisionService();

    first.create({
      id,

      sessionId:
        "session:implementation-test",

      title:
        "Implementation test",

      rationale:
        "Verify approved Executive decisions can be durably consumed.",

      requestedBy:
        "test",

      approvedBy:
        "human:test",

      status:
        "approved",

      metadata: {
        authorityType:
          "knowledge-promotion",

        promotionExecutionAuthorized:
          true,

        promotionExecutionPerformed:
          false,
      },
    });

    const implemented =
      first.implement(
        id,
        "runtime:test",
        {
          promotionExecutionPerformed:
            true,

          promotionExecutionId:
            "promotion:test",
        },
      );

    assert.equal(
      implemented.status,
      "implemented",
    );

    assert.equal(
      implemented.metadata
        .promotionExecutionPerformed,
      true,
    );

    assert.equal(
      implemented.metadata
        .promotionExecutionId,
      "promotion:test",
    );

    const restarted =
      new ExecutiveDecisionService();

    const restored =
      restarted.get(
        id,
      );

    assert.ok(
      restored,
    );

    assert.equal(
      restored.status,
      "implemented",
    );

    assert.equal(
      restored.metadata
        .promotionExecutionPerformed,
      true,
    );

    assert.equal(
      restored.metadata
        .promotionExecutionId,
      "promotion:test",
    );

    cleanup();
  },
);


test(
  "refuses implementation before approval",
  () => {
    cleanup();

    const service =
      new ExecutiveDecisionService();

    service.create({
      id,

      sessionId:
        "session:implementation-test",

      title:
        "Implementation test",

      rationale:
        "Verify fail-closed implementation.",

      requestedBy:
        "test",

      status:
        "proposed",
    });

    assert.throws(
      () =>
        service.implement(
          id,
          "runtime:test",
        ),
      /must be approved before implementation/,
    );

    cleanup();
  },
);
