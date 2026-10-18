import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  bumpRuntimeMutationEpoch,
  cacheUntilRuntimeStateChanges,
  computeRuntimeStateFingerprint,
  trackRuntimeMutations,
} from "../RuntimeStateCache.js";

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "rt1-cache-"));
  fs.mkdirSync(path.join(root, "a"));
  fs.writeFileSync(path.join(root, "a", "one.json"), "{}");
  return root;
}

test("reuses the computed value while state is unchanged", () => {
  const root = tempRoot();
  let calls = 0;
  const read = cacheUntilRuntimeStateChanges(
    () => ({ calls: ++calls }),
    { roots: () => [{ root }] },
  );
  assert.deepEqual(read(), { calls: 1 });
  assert.deepEqual(read(), { calls: 1 });
  assert.equal(calls, 1);
});

test("recomputes after a mutating request", () => {
  const root = tempRoot();
  let calls = 0;
  const read = cacheUntilRuntimeStateChanges(() => ++calls, { roots: () => [{ root }] });
  read();
  bumpRuntimeMutationEpoch();
  read();
  assert.equal(calls, 2);
});

test("recomputes after a file is added, changed, or removed", () => {
  const root = tempRoot();
  let calls = 0;
  const read = cacheUntilRuntimeStateChanges(() => ++calls, { roots: () => [{ root }] });
  read();
  fs.writeFileSync(path.join(root, "a", "two.json"), "{}");
  read();
  fs.writeFileSync(path.join(root, "a", "one.json"), '{"changed":true}');
  read();
  fs.rmSync(path.join(root, "a", "two.json"));
  read();
  assert.equal(calls, 4);
});

test("ignores excluded directories", () => {
  const root = tempRoot();
  fs.mkdirSync(path.join(root, "scratch"));
  const before = computeRuntimeStateFingerprint([{ root, exclude: ["scratch"] }]);
  fs.writeFileSync(path.join(root, "scratch", "x.json"), "{}");
  const after = computeRuntimeStateFingerprint([{ root, exclude: ["scratch"] }]);
  assert.equal(before, after);
});

test("expires after the maximum age", () => {
  const root = tempRoot();
  let clock = 0;
  let calls = 0;
  const read = cacheUntilRuntimeStateChanges(() => ++calls, {
    roots: () => [{ root }],
    maxAgeMs: 1000,
    now: () => clock,
  });
  read();
  clock = 999;
  read();
  clock = 1000;
  read();
  assert.equal(calls, 2);
});

test("never caches a failure", () => {
  const root = tempRoot();
  let calls = 0;
  const read = cacheUntilRuntimeStateChanges(() => {
    calls += 1;
    if (calls === 1) throw new Error("boom");
    return calls;
  }, { roots: () => [{ root }] });
  assert.throws(() => read(), /boom/);
  assert.equal(read(), 2);
  assert.equal(read(), 2);
});

test("does not keep a value computed while state changed", () => {
  const root = tempRoot();
  let calls = 0;
  const read = cacheUntilRuntimeStateChanges(() => {
    calls += 1;
    if (calls === 1) bumpRuntimeMutationEpoch();
    return calls;
  }, { roots: () => [{ root }] });
  assert.equal(read(), 1);
  assert.equal(read(), 2);
  assert.equal(read(), 2);
});

test("callers cannot change the cached value", () => {
  const root = tempRoot();
  const read = cacheUntilRuntimeStateChanges(() => ({ items: [1] }), { roots: () => [{ root }] });
  read().items.push(2);
  read().items.push(3);
  assert.deepEqual(read(), { items: [1] });
});

test("mutating requests bump the epoch; reads do not", () => {
  const root = tempRoot();
  let calls = 0;
  const read = cacheUntilRuntimeStateChanges(() => ++calls, { roots: () => [{ root }] });
  const response = { on: () => undefined } as never;
  read();
  trackRuntimeMutations({ method: "GET" } as never, response, () => undefined);
  read();
  assert.equal(calls, 1);
  trackRuntimeMutations({ method: "PUT" } as never, response, () => undefined);
  read();
  assert.equal(calls, 2);
});
