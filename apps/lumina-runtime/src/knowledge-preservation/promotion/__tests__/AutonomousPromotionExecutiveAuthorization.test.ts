import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  saveExecutiveApproval,
} from "../../../executive/approval/index.js";

import {
  saveExecutiveDecision,
} from "../../../executive/decision/index.js";

import {
  validateExecutivePromotionAuthorization,
} from "../AutonomousGovernedCanonicalPromotionExecutor.js";


const packageId =
  "KP-TEST-EXECUTIVE-AUTH";

const decisionId =
  `executive-decision:knowledge-promotion:${packageId}`;

const approvalId =
  `approval:${decisionId}`;

const decisionFile =
  path.resolve(
    process.cwd(),
    "runtime/executive/decisions",
    `${encodeURIComponent(
      decisionId,
    )}.json`,
  );

const approvalFile =
  path.resolve(
    process.cwd(),
    "runtime/executive/approvals",
    `${encodeURIComponent(
      approvalId,
    )}.json`,
  );


function cleanup(): void {
  fs.rmSync(
    decisionFile,
    {
      force:
        true,
    },
  );

  fs.rmSync(
    approvalFile,
    {
      force:
        true,
    },
  );
}


test(
  "fails closed when executive promotion authorization is absent",
  () => {
    cleanup();

    assert.equal(
      validateExecutivePromotionAuthorization(
        packageId,
      ),
      "executive_promotion_decision_missing",
    );
  },
);


test(
  "accepts matching durable executive decision and approval",
  () => {
    cleanup();

    const now =
      Date.now();

    saveExecutiveDecision({
      id:
        decisionId,

      sessionId:
        `knowledge-promotion:${packageId}`,

      title:
        "Authorize test promotion",

      rationale:
        "Test durable promotion authority.",

      requestedBy:
        "knowledge-governance",

      approvedBy:
        "human-governance",

      status:
        "approved",

      evidence: [],
      consequences: [],

      createdAt:
        now,

      updatedAt:
        now,

      metadata: {
        authorityType:
          "knowledge-promotion",

        packageId,

        promotionExecutionAuthorized:
          true,

        promotionExecutionPerformed:
          false,
      },
    });

    saveExecutiveApproval({
      id:
        approvalId,

      sessionId:
        `knowledge-promotion:${packageId}`,

      decisionId,

      requestedBy:
        "knowledge-governance",

      approverId:
        "human-governance",

      status:
        "approved",

      comments:
        "",

      createdAt:
        now,

      decidedAt:
        now,

      metadata: {},
    });

    assert.equal(
      validateExecutivePromotionAuthorization(
        packageId,
      ),
      null,
    );

    cleanup();
  },
);


test(
  "rejects an executive approval whose identity does not match the decision",
  () => {
    cleanup();

    const now =
      Date.now();

    saveExecutiveDecision({
      id:
        decisionId,

      sessionId:
        `knowledge-promotion:${packageId}`,

      title:
        "Authorize test promotion",

      rationale:
        "Test mismatched authority.",

      requestedBy:
        "knowledge-governance",

      approvedBy:
        "human-governance",

      status:
        "approved",

      evidence: [],
      consequences: [],

      createdAt:
        now,

      updatedAt:
        now,

      metadata: {
        authorityType:
          "knowledge-promotion",

        packageId,

        promotionExecutionAuthorized:
          true,

        promotionExecutionPerformed:
          false,
      },
    });

    saveExecutiveApproval({
      id:
        approvalId,

      sessionId:
        `knowledge-promotion:${packageId}`,

      decisionId,

      requestedBy:
        "knowledge-governance",

      approverId:
        "different-human",

      status:
        "approved",

      comments:
        "",

      createdAt:
        now,

      decidedAt:
        now,

      metadata: {},
    });

    assert.equal(
      validateExecutivePromotionAuthorization(
        packageId,
      ),
      "executive_promotion_approval_identity_mismatch",
    );

    cleanup();
  },
);
