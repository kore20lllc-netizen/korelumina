import assert from "node:assert/strict";
import test from "node:test";

import express from "express";

import {
  registerCanonicalReviewRoutes,
} from "../registerCanonicalReviewRoutes.js";

test(
  "registers governed canonical review POST route",
  () => {
    const app =
      express();

    registerCanonicalReviewRoutes(
      app,
      {
        reviewService:
          {} as never,

        promotionService:
          {} as never,
      },
    );

    const stack =
      (
        app as unknown as {
          _router: {
            stack: Array<{
              route?: {
                path: string;
                methods:
                  Record<string, boolean>;
              };
            }>;
          };
        }
      )._router.stack;

    const registered =
      stack.some(
        (layer) =>
          layer.route?.path ===
            "/api/knowledge/canonical-review" &&
          layer.route.methods.post ===
            true,
      );

    assert.equal(
      registered,
      true,
    );
  },
);
