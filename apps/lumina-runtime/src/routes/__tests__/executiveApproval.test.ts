import assert from "node:assert/strict";
import type {
  Server,
} from "node:http";
import test from "node:test";

import express from "express";

import {
  ExecutiveApprovalDecisionService,
  ExecutiveApprovalService,
} from "../../executive/approval/index.js";

import {
  ExecutiveDecisionService,
} from "../../executive/decision/index.js";

import {
  registerExecutiveApprovalRoute,
} from "../executiveApproval.js";

function createServices() {
  const approvalService =
    new ExecutiveApprovalService();

  const decisionService =
    new ExecutiveDecisionService();

  const approvalDecisionService =
    new ExecutiveApprovalDecisionService(
      approvalService,
      decisionService,
    );

  return {
    approvalService,
    decisionService,
    approvalDecisionService,
  };
}

function createPair(
  approvalService:
    ExecutiveApprovalService,
  decisionService:
    ExecutiveDecisionService,
  suffix:
    string,
) {
  const decision =
    decisionService.create({
      id:
        `decision:${suffix}`,

      sessionId:
        `session:${suffix}`,

      title:
        "Governed decision",

      rationale:
        "Requires explicit human review.",

      requestedBy:
        "chief-agent",

      status:
        "proposed",
    });

  const approval =
    approvalService.create({
      id:
        `approval:${decision.id}`,

      sessionId:
        decision.sessionId,

      decisionId:
        decision.id,

      requestedBy:
        "chief-agent",

      approverId:
        "human:reviewer",
    });

  return {
    decision,
    approval,
  };
}

async function startTestServer() {
  const services =
    createServices();

  const app =
    express();

  app.use(
    express.json(),
  );

  registerExecutiveApprovalRoute(
    app,
    {
      approvalService:
        services.approvalService,

      approvalDecisionService:
        services.approvalDecisionService,
    },
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
    ...services,
    server,

    baseUrl:
      `http://127.0.0.1:${address.port}`,
  };
}

async function closeServer(
  server:
    Server,
) {
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

test(
  "reads an existing pending approval",
  async () => {
    const context =
      await startTestServer();

    try {
      const {
        approval,
      } =
        createPair(
          context.approvalService,
          context.decisionService,
          "read",
        );

      const response =
        await fetch(
          `${context.baseUrl}/api/executive/approvals/${encodeURIComponent(approval.id)}`,
        );

      assert.equal(
        response.status,
        200,
      );

      const body =
        await response.json();

      assert.equal(
        body.approval.status,
        "pending",
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);

test(
  "explicit authorized human approval synchronizes approval and decision",
  async () => {
    const context =
      await startTestServer();

    try {
      const {
        approval,
      } =
        createPair(
          context.approvalService,
          context.decisionService,
          "approve",
        );

      const response =
        await fetch(
          `${context.baseUrl}/api/executive/approvals/${encodeURIComponent(approval.id)}/approve`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                actorId:
                  "human:reviewer",
              }),
          },
        );

      assert.equal(
        response.status,
        200,
      );

      const body =
        await response.json();

      assert.equal(
        body.approval.status,
        "approved",
      );

      assert.equal(
        body.decision.status,
        "approved",
      );

      assert.equal(
        body.decision.approvedBy,
        "human:reviewer",
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);

test(
  "explicit authorized human rejection synchronizes approval and decision",
  async () => {
    const context =
      await startTestServer();

    try {
      const {
        approval,
      } =
        createPair(
          context.approvalService,
          context.decisionService,
          "reject",
        );

      const response =
        await fetch(
          `${context.baseUrl}/api/executive/approvals/${encodeURIComponent(approval.id)}/reject`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                actorId:
                  "human:reviewer",

                reason:
                  "Architecture review rejected.",
              }),
          },
        );

      assert.equal(
        response.status,
        200,
      );

      const body =
        await response.json();

      assert.equal(
        body.approval.status,
        "rejected",
      );

      assert.equal(
        body.decision.status,
        "rejected",
      );

      assert.equal(
        body.approval.comments,
        "Architecture review rejected.",
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);

test(
  "rejects a caller that is not the assigned approver",
  async () => {
    const context =
      await startTestServer();

    try {
      const {
        approval,
        decision,
      } =
        createPair(
          context.approvalService,
          context.decisionService,
          "unauthorized",
        );

      const response =
        await fetch(
          `${context.baseUrl}/api/executive/approvals/${encodeURIComponent(approval.id)}/approve`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                actorId:
                  "human:other",
              }),
          },
        );

      assert.equal(
        response.status,
        403,
      );

      assert.equal(
        context.approvalService
          .get(
            approval.id,
          )
          ?.status,
        "pending",
      );

      assert.equal(
        context.decisionService
          .get(
            decision.id,
          )
          ?.status,
        "proposed",
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);

test(
  "prevents deciding an approval twice",
  async () => {
    const context =
      await startTestServer();

    try {
      const {
        approval,
      } =
        createPair(
          context.approvalService,
          context.decisionService,
          "twice",
        );

      const url =
        `${context.baseUrl}/api/executive/approvals/${encodeURIComponent(approval.id)}/approve`;

      const request = () =>
        fetch(
          url,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                actorId:
                  "human:reviewer",
              }),
          },
        );

      const first =
        await request();

      assert.equal(
        first.status,
        200,
      );

      const second =
        await request();

      assert.equal(
        second.status,
        409,
      );

      const body =
        await second.json();

      assert.equal(
        body.error,
        "executive_approval_not_pending",
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);
