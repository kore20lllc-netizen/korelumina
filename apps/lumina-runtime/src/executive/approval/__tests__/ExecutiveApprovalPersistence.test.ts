import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  ExecutiveApprovalService,
} from "../ExecutiveApprovalService.js";


const id =
  "approval:persistence-test";

const file =
  path.resolve(
    process.cwd(),
    "runtime/executive/approvals",
    `${encodeURIComponent(
      id,
    )}.json`,
  );


test(
  "reloads an executive approval after service restart",
  () => {
    fs.rmSync(
      file,
      {
        force:
          true,
      },
    );

    const first =
      new ExecutiveApprovalService();

    first.create({
      id,
      sessionId:
        "session:persistence-test",
      decisionId:
        "decision:persistence-test",
      requestedBy:
        "test",
      approverId:
        "human:test",
    });

    const second =
      new ExecutiveApprovalService();

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

    assert.equal(
      restored.status,
      "pending",
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
