import assert from "node:assert/strict";
import type {
  Server,
} from "node:http";
import test from "node:test";

import express from "express";

import {
  registerExecutiveOperationsSnapshotRoute,
} from "../executiveOperationsSnapshot.js";

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
            ? reject(error)
            : resolve(),
      ),
  );
}

test(
  "returns authoritative executive snapshot newest first",
  async () => {
    const app =
      express();

    registerExecutiveOperationsSnapshotRoute(
      app,
      {
        reasoningService: {
          list:
            () => [
              {
                id:
                  "reasoning:old",

                disposition:
                  "deny",

                createdAt:
                  10,

                updatedAt:
                  10,
              },

              {
                id:
                  "reasoning:new",

                disposition:
                  "review",

                createdAt:
                  20,

                updatedAt:
                  30,
              },
            ],
        },

        decisionService: {
          list:
            () => [
              {
                id:
                  "decision:1",

                createdAt:
                  20,
              },
            ],
        },

        approvalService: {
          list:
            () => [
              {
                id:
                  "approval:pending",

                status:
                  "pending",

                createdAt:
                  20,
              },

              {
                id:
                  "approval:approved",

                status:
                  "approved",

                createdAt:
                  10,
              },
            ],
        },

        delegationService: {
          list:
            () => [],
        },

        actionService: {
          list:
            () => [
              {
                id:
                  "action:1",

                createdAt:
                  20,
              },
            ],
        },

        auditService: {
          list:
            () => [
              {
                id:
                  "audit:open",

                status:
                  "open",

                createdAt:
                  20,
              },

              {
                id:
                  "audit:closed",

                status:
                  "closed",

                createdAt:
                  10,
              },
            ],
        },

        mutationEnabled:
          false,
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

    try {
      const address =
        server.address();

      assert.ok(
        address &&
        typeof address !==
          "string",
      );

      const response =
        await fetch(
          `http://127.0.0.1:${address.port}/api/executive/operations`,
        );

      assert.equal(
        response.status,
        200,
      );

      const body =
        await response.json();

      assert.equal(
        body.ok,
        true,
      );

      assert.equal(
        body.mutationEnabled,
        false,
      );

      assert.equal(
        body.summary.reasoning,
        2,
      );

      assert.equal(
        body.summary.pendingApprovals,
        1,
      );

      assert.equal(
        body.summary.openAudits,
        1,
      );

      assert.equal(
        body.reasoning[0].id,
        "reasoning:new",
      );

      assert.equal(
        body.reasoning[1].id,
        "reasoning:old",
      );
    } finally {
      await closeServer(
        server,
      );
    }
  },
);
