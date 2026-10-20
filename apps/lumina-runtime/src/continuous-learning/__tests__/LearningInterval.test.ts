import assert from "node:assert/strict";
import test from "node:test";

import { ContinuousLearningScheduler, resolveLearningIntervalMinutes } from "../index.js";

test("automatic learning checks every 30 minutes unless configured", () => {
  assert.equal(resolveLearningIntervalMinutes(undefined), 30);
  assert.equal(resolveLearningIntervalMinutes(""), 30);
  assert.equal(resolveLearningIntervalMinutes("10"), 10);
  assert.equal(resolveLearningIntervalMinutes("0"), 0);
  assert.equal(resolveLearningIntervalMinutes("nope"), 30);
});

/* F-32: a Runtime restarted more often than the interval still learns. */
function countingService() {
  const service = {
    runs: 0,
    isRunning: () => false,
    run: async () => {
      service.runs += 1;
      return { outcome: "NO_NEW_WORK", commits: [], reasons: [] } as any;
    },
  };
  return service;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test("the first learning check runs shortly after start, not only after the interval", async () => {
  const service = countingService();
  const scheduler = new ContinuousLearningScheduler(service, 30, () => {}, 10);
  scheduler.start();
  await wait(60);
  scheduler.stop();
  assert.equal(service.runs, 1);
});

test("stopping before the first check cancels it, and 0 minutes turns learning checks off", async () => {
  const stopped = countingService();
  const scheduler = new ContinuousLearningScheduler(stopped, 30, () => {}, 20);
  scheduler.start();
  scheduler.stop();
  const off = countingService();
  new ContinuousLearningScheduler(off, 0, () => {}, 5).start();
  await wait(60);
  assert.equal(stopped.runs, 0);
  assert.equal(off.runs, 0);
});
