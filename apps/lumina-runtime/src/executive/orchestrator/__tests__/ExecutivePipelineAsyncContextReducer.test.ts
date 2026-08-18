import assert from "node:assert/strict";
import test from "node:test";

import {
  createExecutiveContext,
} from "../../context/index.js";

import {
  createExecutiveEvent,
} from "../../events/index.js";

import {
  ExecutivePipeline,
  type ExecutiveContextReducer,
} from "../ExecutivePipeline.js";

class TestKernel {
  private context =
    createExecutiveContext();

  readonly eventBus = {
    async publish() {},
  };

  getContext() {
    return this.context;
  }

  replaceContext(
    context:
      ReturnType<
        typeof createExecutiveContext
      >,
  ) {
    this.context =
      context;
  }
}

const validator = {
  validate() {
    return {
      valid: true,
      reasons: [],
    };
  },
};

const router = {
  route() {
    return {
      destination:
        "test",

      reason:
        "test-route",
    };
  },
};

const dispatcher = {
  async dispatch() {
    return {
      successful: true,
      records: [],
    };
  },
};

function createTestEvent() {
  return createExecutiveEvent({
    id:
      "event:test",

    type:
      "test.event",

    category:
      "knowledge",

    source:
      "test",

    actor: {
      id:
        "agent:test",

      type:
        "chief-agent",
    },

    confidence:
      "validated",

    payload:
      {},
  });
}

test(
  "pipeline preserves synchronous context reducer compatibility",
  async () => {
    const kernel =
      new TestKernel();

    const contextReducer:
      ExecutiveContextReducer = {
        reduce(
          current,
        ) {
          return {
            ...current,

            knowledgeState: {
              id:
                "knowledge:sync",
            },
          };
        },
      };

    const pipeline =
      new ExecutivePipeline({
        kernel:
          kernel as never,

        validator,

        contextReducer,

        router:
          router as never,

        dispatcher:
          dispatcher as never,
      });

    const result =
      await pipeline.process(
        createTestEvent(),
      );

    assert.equal(
      result.lifecycle.stage,
      "completed",
    );

    assert.equal(
      result.context
        .knowledgeState
        ?.id,
      "knowledge:sync",
    );

    assert.equal(
      kernel
        .getContext()
        .knowledgeState
        ?.id,
      "knowledge:sync",
    );
  },
);

test(
  "pipeline awaits asynchronous knowledge-aware context reducer",
  async () => {
    const kernel =
      new TestKernel();

    let reducerCompleted =
      false;

    const contextReducer:
      ExecutiveContextReducer = {
        async reduce(
          current,
        ) {
          await Promise.resolve();

          reducerCompleted =
            true;

          return {
            ...current,

            knowledgeState: {
              id:
                "knowledge:async",
            },
          };
        },
      };

    const pipeline =
      new ExecutivePipeline({
        kernel:
          kernel as never,

        validator,

        contextReducer,

        router:
          router as never,

        dispatcher:
          dispatcher as never,
      });

    const result =
      await pipeline.process(
        createTestEvent(),
      );

    assert.equal(
      reducerCompleted,
      true,
    );

    assert.equal(
      result.lifecycle.stage,
      "completed",
    );

    assert.equal(
      result.context
        .knowledgeState
        ?.id,
      "knowledge:async",
    );

    assert.equal(
      kernel
        .getContext()
        .knowledgeState
        ?.id,
      "knowledge:async",
    );
  },
);
