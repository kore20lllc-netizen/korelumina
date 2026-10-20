import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { CanonicalRetirementLedger } from "../CanonicalRetirementLedger.js";
import { GenesisCurrentPolicyCanonicalView } from "../../../knowledge-preservation/genesis/GenesisCurrentPolicyCanonicalView.js";

/* F-28: owner-retired canonical knowledge leaves current policy, and nothing else does. */

function ledgerWith(records: Record<string, unknown>[]) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "korelumina-retirement-"));
  records.forEach((record, index) => fs.writeFileSync(path.join(root, `${index}.json`), JSON.stringify(record)));
  return new CanonicalRetirementLedger(() => root);
}

const valid = {
  id: "canonical-retirement:test",
  canonicalIds: ["canonical:document:fixture"],
  reason: "A pipeline test fixture, not governing knowledge.",
  decidedBy: "human:founder",
  decidedAt: "2026-10-19T00:00:00.000Z",
};

test("a human-decided retirement record retires its canonical ids", () => {
  assert.deepEqual(ledgerWith([valid]).retiredCanonicalIds(), ["canonical:document:fixture"]);
});

for (const [name, record] of [
  ["decided by an agent", { ...valid, decidedBy: "chief-agent" }],
  ["without a real reason", { ...valid, reason: "x" }],
  ["naming a non-canonical id", { ...valid, canonicalIds: ["evidence:fixture"] }],
] as const) {
  test(`a record ${name} is ignored`, () => {
    assert.deepEqual(ledgerWith([record]).retiredCanonicalIds(), []);
  });
}

test("no records folder means nothing is retired", () => {
  assert.deepEqual(new CanonicalRetirementLedger(() => path.join(os.tmpdir(), "korelumina-no-such-folder")).retiredCanonicalIds(), []);
});

test("the current-policy view drops retired items and keeps every other one", () => {
  const item = (id: string) => ({ id }) as never;
  const view = new GenesisCurrentPolicyCanonicalView(
    { list: () => [item("canonical:document:fixture"), item("canonical:document:constitution")] },
    { records: [] } as never,
    ["canonical:document:fixture"],
  );
  assert.deepEqual(view.list().map((entry: { id: string }) => entry.id), ["canonical:document:constitution"]);
  assert.deepEqual(view.suppressedIds(), ["canonical:document:fixture"]);
});
