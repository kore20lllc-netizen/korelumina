import assert from "node:assert/strict";
import test from "node:test";

import {
  runtimeKnowledgeProvider,
} from "../knowledge-platform/runtime/index.js";

import {
  KnowledgeContextBuilder,
} from "../knowledge-platform/context/index.js";

import {
  createExecutiveOrchestrator,
} from "../executive/orchestrator/index.js";

test(
  "runtime executive composition uses the shared runtime knowledge platform",
  async () => {
    const sharedPlatform =
      runtimeKnowledgeProvider
        .getPlatform();

    const samePlatform =
      runtimeKnowledgeProvider
        .getPlatform();

    assert.equal(
      sharedPlatform,
      samePlatform,
    );

    const knowledgeContextBuilder =
      new KnowledgeContextBuilder(
        sharedPlatform,
      );

    const executive =
      createExecutiveOrchestrator({
        knowledgeContextBuilder,
      });

    assert.ok(
      executive.orchestrator,
    );

    assert.equal(
      executive.kernel.getContext()
        .knowledgeState,
      undefined,
    );
  },
);
