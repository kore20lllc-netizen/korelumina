import assert from "node:assert/strict";
import test from "node:test";

import express from "express";

import {
  ExecutiveReasoningService,
} from "../../executive/reasoning/index.js";

import {
  registerExecutiveReasoningRoute,
} from "../executiveReasoning.js";

test(
  "registers executive reasoning read route against existing reasoning service",
  async () => {
    const reasoningService =
      new ExecutiveReasoningService();

    reasoningService.create({
      id:
        "reasoning:event:test",

      sessionId:
        "event:test",

      title:
        "Architecture direction",

      question:
        "Which architecture should we follow?",

      conclusion:
        "Use canonical architecture.",

      disposition:
        "review",

      confidence:
        0.9,

      evidence: [
        "canonical:architecture",
      ],

      assumptions:
        [],

      status:
        "completed",
    });

    const app =
      express();

    registerExecutiveReasoningRoute(
      app,
      reasoningService,
    );

    const server =
      app.listen(
        0,
      );

    try {
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

      const response =
        await fetch(
          `http://127.0.0.1:${address.port}/api/executive/reasoning/${encodeURIComponent("reasoning:event:test")}`,
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
        body.reasoning.id,
        "reasoning:event:test",
      );

      assert.equal(
        body.reasoning.conclusion,
        "Use canonical architecture.",
      );
    } finally {
      await new Promise<void>(
        (resolve, reject) => {
          server.close(
            (error) => {
              if (
                error
              ) {
                reject(
                  error,
                );
                return;
              }

              resolve();
            },
          );
        },
      );
    }
  },
);

test(
  "returns 404 for unknown reasoning id",
  async () => {
    const app =
      express();

    registerExecutiveReasoningRoute(
      app,
      new ExecutiveReasoningService(),
    );

    const server =
      app.listen(
        0,
      );

    try {
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

      const response =
        await fetch(
          `http://127.0.0.1:${address.port}/api/executive/reasoning/${encodeURIComponent("reasoning:missing")}`,
        );

      assert.equal(
        response.status,
        404,
      );

      const body =
        await response.json();

      assert.equal(
        body.error,
        "executive_reasoning_not_found",
      );
    } finally {
      await new Promise<void>(
        (resolve, reject) => {
          server.close(
            (error) => {
              if (
                error
              ) {
                reject(
                  error,
                );
                return;
              }

              resolve();
            },
          );
        },
      );
    }
  },
);
