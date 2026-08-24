import assert from "node:assert/strict";
import test from "node:test";

import type {
  Express,
  Request,
  Response,
} from "express";

import {
  registerKnowledgeOperationsRoutes,
} from "../registerKnowledgeOperationsRoutes.js";


test(
  "Knowledge Operations route uses explicitly injected Runtime service",
  () => {
    let registeredPath:
      string | null =
        null;

    let registeredHandler:
      (
        req: Request,
        res: Response,
      ) => void =
        () => {
          throw new Error(
            "knowledge_operations_handler_not_registered",
          );
        };

    const app = {
      get:
        (
          path:
            string,

          handler:
            (
              req: Request,
              res: Response,
            ) => void,
        ) => {
          registeredPath =
            path;

          registeredHandler =
            handler;
        },
    } as unknown as Express;


    const expected = {
      marker:
        "runtime-current-policy-truth",
    };


    registerKnowledgeOperationsRoutes(
      app,
      {
        service: {
          getSnapshot:
            () =>
              expected as any,
        },
      },
    );


    assert.equal(
      registeredPath,
      "/api/knowledge/operations",
    );


    let response:
      unknown =
        null;

    registeredHandler(
      {} as Request,

      {
        json:
          (
            value:
              unknown,
          ) => {
            response =
              value;

            return value;
          },
      } as unknown as Response,
    );


    assert.equal(
      response,
      expected,
    );
  },
);
