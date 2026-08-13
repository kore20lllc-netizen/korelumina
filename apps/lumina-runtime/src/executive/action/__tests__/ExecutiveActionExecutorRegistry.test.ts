import assert from "node:assert/strict";
import test from "node:test";

import type {
  ExecutiveActionExecutor,
} from "../ExecutiveActionExecutor.js";

import {
  ExecutiveActionExecutorRegistry,
} from "../ExecutiveActionExecutorRegistry.js";

function createExecutor(
  name: string,
): ExecutiveActionExecutor {
  return {
    name,

    execute: async () => ({
      ok:
        true,

      summary:
        "test",

      evidence:
        [],

      metadata: {},
    }),
  };
}

test(
  "registered operation resolves exact executor",
  () => {
    const registry =
      new ExecutiveActionExecutorRegistry();

    const executor =
      createExecutor(
        "reader",
      );

    registry.register(
      "filesystem.read",
      executor,
    );

    assert.equal(
      registry.resolve({
        type:
          "filesystem.read",

        path:
          "README.md",
      }),
      executor,
    );
  },
);

test(
  "unregistered operation is denied",
  () => {
    const registry =
      new ExecutiveActionExecutorRegistry();

    assert.throws(
      () =>
        registry.resolve({
          type:
            "filesystem.write",

          path:
            "README.md",

          content:
            "mutation",
        }),
      /executive_action_executor_operation_not_registered/,
    );
  },
);

test(
  "duplicate operation registration is rejected",
  () => {
    const registry =
      new ExecutiveActionExecutorRegistry();

    registry.register(
      "filesystem.read",
      createExecutor(
        "reader-one",
      ),
    );

    assert.throws(
      () =>
        registry.register(
          "filesystem.read",
          createExecutor(
            "reader-two",
          ),
        ),
      /executive_action_executor_operation_already_registered/,
    );
  },
);

test(
  "registry exposes operation mapping without arbitrary selection",
  () => {
    const registry =
      new ExecutiveActionExecutorRegistry();

    registry.register(
      "filesystem.read",
      createExecutor(
        "project-filesystem-read",
      ),
    );

    assert.deepEqual(
      registry.list(),
      [
        {
          operationType:
            "filesystem.read",

          executorName:
            "project-filesystem-read",
        },
      ],
    );
  },
);
