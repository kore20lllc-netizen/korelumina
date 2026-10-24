import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { dependencyFingerprint, ensureProjectIsolation } from "../ensureProjectIsolation.js";

/* F-50: preparing a project never freezes Runtime, and good dependencies are not reinstalled. */

function project(withNodeModules: boolean): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "isolation-"));
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ name: "demo", version: "1.0.0", private: true, scripts: { dev: "vite" } }));
  if (withNodeModules) fs.mkdirSync(path.join(root, "node_modules"));
  return root;
}

test("Runtime keeps answering while a project's dependencies are checked", async () => {
  const root = project(true);
  let ticks = 0;
  const timer = setInterval(() => {
    ticks += 1;
  }, 5);
  try {
    const result = await ensureProjectIsolation(root);
    assert.equal(result.installSkipped, true);
  } finally {
    clearInterval(timer);
  }
  assert.ok(ticks > 0, "the event loop ran while npm checked the dependencies");
});

test("two starts of the same project share one preparation", async () => {
  const root = project(true);
  const first = ensureProjectIsolation(root);
  const second = ensureProjectIsolation(root);
  assert.equal(first, second);
  await first;
  const third = ensureProjectIsolation(root);
  assert.notEqual(third, first, "a finished preparation is not reused");
  await third;
});

test("dependencies installed from the same manifest and lockfile are trusted without npm", async () => {
  const root = project(true);
  fs.writeFileSync(path.join(root, "bun.lockb"), "lock");
  fs.writeFileSync(
    path.join(root, "node_modules", ".korelumina-install.json"),
    JSON.stringify({ fingerprint: dependencyFingerprint(root), packageManager: "bun" }),
  );
  const result = await ensureProjectIsolation(root);
  assert.equal(result.installSkipped, true);
  assert.ok(fs.existsSync(path.join(root, "node_modules")), "node_modules is kept, not deleted and reinstalled");

  const before = dependencyFingerprint(root);
  fs.writeFileSync(path.join(root, "bun.lockb"), "changed lock");
  assert.notEqual(dependencyFingerprint(root), before, "a changed lockfile changes the fingerprint");
});
