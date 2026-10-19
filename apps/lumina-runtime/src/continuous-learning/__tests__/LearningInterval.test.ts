import assert from "node:assert/strict";
import test from "node:test";

import { resolveLearningIntervalMinutes } from "../index.js";

test("automatic learning checks every 30 minutes unless configured", () => {
  assert.equal(resolveLearningIntervalMinutes(undefined), 30);
  assert.equal(resolveLearningIntervalMinutes(""), 30);
  assert.equal(resolveLearningIntervalMinutes("10"), 10);
  assert.equal(resolveLearningIntervalMinutes("0"), 0);
  assert.equal(resolveLearningIntervalMinutes("nope"), 30);
});
