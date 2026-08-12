import assert from "node:assert/strict";
import test from "node:test";

import express from "express";

import {
  ExecutiveApprovalService,
} from "../../executive/approval/index.js";

import {
  registerExecutiveApprovalRoute,
} from "../executiveApproval.js";

async function startTestServer(
  approvalService:
    ExecutiveApprovalService,
) {
  const app =
    express();

  registerExecutiveApprovalRoute(
    app,
    approvalService,
  );

  const server =
    app.listen(
      0,
    );

  await new Promise<void>(
    (resolve) =>
      server.once(
        "listening",
        resolve,
      ),
  );

  const address =
    server.address();

  if (
    !address ||
    typeof address ===
      "string"
  ) {
    throw new Error(
      "test_server_address_unavailable",
    );
  }

  return {
    server,

    baseUrl:
      `http://127.0.0.1:${address.port}`,
  };
}

test(
  "returns an existing pending executive approval",
  async () => {
    const approvalService =
      new ExecutiveApprovalService();

    const approval =
      approvalService.create({
        id:
          "approval:decision:reasoning:event:test",

        sessionId:
          "event:test",

        decisionId:
          "decision:reasoning:event:test",

        requestedBy:
          "chief-agent",

        approverId:
          "human:architecture-reviewer",
      });

    const {
      server,
      baseUrl,
    } =
      await startTestServer(
        approvalService,
      );

    try {
      const response =
        await fetch(
          `${baseUrl}/api/executive/approvals/${encodeURIComponent(approval.id)}`,
        );

      assert.equal(
        response.status,
        200,
      );

      const body =
        await response.json() as {
          ok: boolean;

          approval: {
            id: string;
            status: string;
            decisionId: string;
            approverId: string;
            decidedAt?: number;
          };
        };

      assert.equal(
        body.ok,
        true,
      );

      assert.equal(
        body.approval.id,
        approval.id,
      );

      assert.equal(
        body.approval.status,
        "pending",
      );

      assert.equal(
        body.approval.decisionId,
        approval.decisionId,
      );

      assert.equal(
        body.approval.approverId,
        "human:architecture-reviewer",
      );

      assert.equal(
        body.approval.decidedAt,
        undefined,
      );
    } finally {
      await new Promise<void>(
        (
          resolve,
          reject,
        ) =>
          server.close(
            (error) =>
              error
                ? reject(
                    error,
                  )
                : resolve(),
          ),
      );
    }
  },
);

test(
  "returns 404 for an unknown executive approval",
  async () => {
    const {
      server,
      baseUrl,
    } =
      await startTestServer(
        new ExecutiveApprovalService(),
      );

    try {
      const response =
        await fetch(
          `${baseUrl}/api/executive/approvals/${encodeURIComponent("approval:missing")}`,
        );

      assert.equal(
        response.status,
        404,
      );

      const body =
        await response.json();

      assert.deepEqual(
        body,
        {
          ok:
            false,

          error:
            "executive_approval_not_found",

          id:
            "approval:missing",
        },
      );
    } finally {
      await new Promise<void>(
        (
          resolve,
          reject,
        ) =>
          server.close(
            (error) =>
              error
                ? reject(
                    error,
                  )
                : resolve(),
          ),
      );
    }
  },
);
