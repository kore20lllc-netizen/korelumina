import assert from "node:assert/strict";
import test from "node:test";

import express from "express";

import {
  ExecutiveDecisionService,
} from "../../executive/decision/index.js";

import {
  registerExecutiveDecisionRoute,
} from "../executiveDecision.js";

async function startTestServer(
  decisionService:
    ExecutiveDecisionService,
) {
  const app =
    express();

  registerExecutiveDecisionRoute(
    app,
    decisionService,
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
  "returns an existing proposed executive decision",
  async () => {
    const decisionService =
      new ExecutiveDecisionService();

    const decision =
      decisionService.create({
        id:
          "decision:reasoning:event:test",

        sessionId:
          "event:test",

        title:
          "Preserve architecture boundaries",

        rationale:
          "Preserve governed architecture.",

        requestedBy:
          "chief-agent",

        status:
          "proposed",

        evidence: [
          "canonical:test",
        ],
      });

    const {
      server,
      baseUrl,
    } =
      await startTestServer(
        decisionService,
      );

    try {
      const encodedId =
        encodeURIComponent(
          decision.id,
        );

      const response =
        await fetch(
          `${baseUrl}/api/executive/decisions/${encodedId}`,
        );

      assert.equal(
        response.status,
        200,
      );

      const body =
        await response.json() as {
          ok: boolean;
          decision: {
            id: string;
            status: string;
            approvedBy?: string;
          };
        };

      assert.equal(
        body.ok,
        true,
      );

      assert.equal(
        body.decision.id,
        decision.id,
      );

      assert.equal(
        body.decision.status,
        "proposed",
      );

      assert.equal(
        body.decision.approvedBy,
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
  "returns 404 for an unknown executive decision",
  async () => {
    const {
      server,
      baseUrl,
    } =
      await startTestServer(
        new ExecutiveDecisionService(),
      );

    try {
      const response =
        await fetch(
          `${baseUrl}/api/executive/decisions/${encodeURIComponent("decision:missing")}`,
        );

      assert.equal(
        response.status,
        404,
      );

      const body =
        await response.json() as {
          ok: boolean;
          error: string;
          id: string;
        };

      assert.deepEqual(
        body,
        {
          ok:
            false,

          error:
            "executive_decision_not_found",

          id:
            "decision:missing",
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
