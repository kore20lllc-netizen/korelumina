import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  ExecutiveDecisionService,
} from "../ExecutiveDecisionService.js";


const id =
  "decision:persistence-test";

const file =
  path.resolve(
    process.cwd(),
    "runtime/executive/decisions",
    `${encodeURIComponent(
      id,
    )}.json`,
  );


test(
  "reloads an executive decision after service restart",
  () => {
    fs.rmSync(
      file,
      {
        force:
          true,
      },
    );

    const first =
      new ExecutiveDecisionService();

    first.create({
      id,
      sessionId:
        "session:persistence-test",
      title:
        "Persistence test",
      rationale:
        "Verify durable executive decisions.",
      requestedBy:
        "test",
    });

    const second =
      new ExecutiveDecisionService();

    const restored =
      second.get(
        id,
      );

    assert.ok(
      restored,
    );

    assert.equal(
      restored.id,
      id,
    );

    fs.rmSync(
      file,
      {
        force:
          true,
      },
    );
  },
);
