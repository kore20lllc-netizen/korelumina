import assert from "node:assert/strict";
import test from "node:test";

import express from "express";

import {
  registerExecutiveRoute,
} from "../executive.js";

test(
  "registers POST executive event route",
  () => {
    const app =
      express();

    const runtime = {
      orchestrator: {
        async publish() {
          return {
            lifecycle: {
              stage:
                "completed",
            },

            context: {
              activeAgents: [],
              observedAt: 1,
            },
          };
        },
      },
    };

    registerExecutiveRoute(
      app,
      runtime as never,
    );

    type RouteLayer = {
      route?: {
        path: string;
        methods:
          Record<string, boolean>;
      };
    };

    type RegisteredRouteLayer = {
      route: {
        path: string;
        methods:
          Record<string, boolean>;
      };
    };

    const stack =
      (
        app as unknown as {
          _router: {
            stack: RouteLayer[];
          };
        }
      )._router.stack;

    const routes =
      stack
        .filter(
          (
            layer,
          ): layer is RegisteredRouteLayer =>
            Boolean(
              layer.route,
            ),
        )
        .map(
          (layer) => ({
            path:
              layer.route.path,

            methods:
              layer.route.methods,
          }),
        );

    assert.ok(
      routes.some(
        (route) =>
          route.path ===
            "/api/executive/events" &&
          route.methods.post ===
            true,
      ),
    );
  },
);
