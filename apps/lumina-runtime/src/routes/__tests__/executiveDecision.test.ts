import assert from "node:assert/strict";
import type {
  Server,
} from "node:http";
import test from "node:test";

import express from "express";

import {
  ExecutiveActionService,
  ExecutiveDecisionActionProposalService,
  ExecutiveDelegationActionProposalService,
} from "../../executive/action/index.js";

import {
  ExecutiveDecisionService,
} from "../../executive/decision/index.js";

import {
  ExecutiveDecisionDelegationService,
  ExecutiveDelegationService,
} from "../../executive/delegation/index.js";

import {
  registerExecutiveDecisionRoute,
} from "../executiveDecision.js";

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

async function startServer() {
  const decisionService =
    new ExecutiveDecisionService();

  const delegationService =
    new ExecutiveDelegationService();

  const actionService =
    new ExecutiveActionService();

  const app =
    express();

  app.use(
    express.json(),
  );

  registerExecutiveDecisionRoute(
    app,
    {
      decisionService,

      decisionDelegationService:
        new ExecutiveDecisionDelegationService(
          delegationService,
        ),

      delegationActionProposalService:
        new ExecutiveDelegationActionProposalService(
          new ExecutiveDecisionActionProposalService(
            actionService,
          ),
        ),
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
    server,
    decisionService,
    delegationService,
    actionService,

    baseUrl:
      `http://127.0.0.1:${address.port}`,
  };
}

test(
  "reads an existing executive decision",
  async () => {
    const context =
      await startServer();

    try {
      const decision =
        context.decisionService
          .create({
            id:
              "decision:read",

            sessionId:
              "session:read",

            title:
              "Read decision",

            rationale:
              "Read only.",

            requestedBy:
              "chief-agent",

            status:
              "proposed",
          });

      const response =
        await fetch(
          `${context.baseUrl}/api/executive/decisions/${encodeURIComponent(decision.id)}`,
        );

      assert.equal(
        response.status,
        200,
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);

test(
  "approved human can explicitly delegate and create only a planned action",
  async () => {
    const context =
      await startServer();

    try {
      context.decisionService
        .create({
          id:
            "decision:delegate",

          sessionId:
            "session:delegate",

          title:
            "Governed execution",

          rationale:
            "Delegate approved work.",

          requestedBy:
            "chief-agent",

          approvedBy:
            "human:reviewer",

          status:
            "approved",

          evidence: [
            "canonical:architecture",
          ],
        });

      const response =
        await fetch(
          `${context.baseUrl}/api/executive/decisions/${encodeURIComponent("decision:delegate")}/delegate`,
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

                assignedTo:
                  "agent:architecture-engineer",

                priority:
                  "high",
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
        body.delegation.status,
        "assigned",
      );

      assert.equal(
        body.delegation.assignedTo,
        "agent:architecture-engineer",
      );

      assert.equal(
        body.action.status,
        "planned",
      );

      assert.equal(
        body.action.ownerId,
        body.delegation.assignedTo,
      );

      assert.equal(
        body.action.delegationId,
        body.delegation.id,
      );

      assert.equal(
        body.action.startedAt,
        undefined,
      );

      assert.equal(
        body.action.completedAt,
        undefined,
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);

test(
  "cannot delegate an unapproved decision",
  async () => {
    const context =
      await startServer();

    try {
      context.decisionService
        .create({
          id:
            "decision:unapproved",

          sessionId:
            "session:unapproved",

          title:
            "Unapproved",

          rationale:
            "Still proposed.",

          requestedBy:
            "chief-agent",

          status:
            "proposed",
        });

      const response =
        await fetch(
          `${context.baseUrl}/api/executive/decisions/${encodeURIComponent("decision:unapproved")}/delegate`,
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

                assignedTo:
                  "agent:executor",
              }),
          },
        );

      assert.equal(
        response.status,
        409,
      );

      assert.deepEqual(
        context.delegationService.list(),
        [],
      );

      assert.deepEqual(
        context.actionService.list(),
        [],
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);

test(
  "cannot delegate using a human other than the decision approver",
  async () => {
    const context =
      await startServer();

    try {
      context.decisionService
        .create({
          id:
            "decision:unauthorized",

          sessionId:
            "session:unauthorized",

          title:
            "Approved",

          rationale:
            "Requires approved human delegation.",

          requestedBy:
            "chief-agent",

          approvedBy:
            "human:reviewer",

          status:
            "approved",
        });

      const response =
        await fetch(
          `${context.baseUrl}/api/executive/decisions/${encodeURIComponent("decision:unauthorized")}/delegate`,
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

                assignedTo:
                  "agent:executor",
              }),
          },
        );

      assert.equal(
        response.status,
        403,
      );

      assert.deepEqual(
        context.delegationService.list(),
        [],
      );

      assert.deepEqual(
        context.actionService.list(),
        [],
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);

test(
  "approved decision without evidence cannot cross into delegation or planned action",
  async () => {
    const context =
      await startServer();

    try {
      context.decisionService
        .create({
          id:
            "decision:no-evidence",

          sessionId:
            "session:no-evidence",

          title:
            "Insufficient Knowledge",

          rationale:
            "Governed evidence is unavailable.",

          requestedBy:
            "chief-agent",

          approvedBy:
            "human:reviewer",

          status:
            "approved",

          evidence:
            [],
        });

      const response =
        await fetch(
          `${context.baseUrl}/api/executive/decisions/${encodeURIComponent("decision:no-evidence")}/delegate`,
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

                assignedTo:
                  "agent:executor",
              }),
          },
        );

      assert.equal(
        response.status,
        409,
      );

      const body =
        await response.json();

      assert.equal(
        body.error,
        "executive_decision_evidence_required_for_delegation",
      );

      assert.deepEqual(
        context.delegationService.list(),
        [],
      );

      assert.deepEqual(
        context.actionService.list(),
        [],
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);
