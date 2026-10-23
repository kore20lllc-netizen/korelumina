import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { applyDraft } from "../applyDraft.js";
import { normalizePatchPath, patchProblem } from "../patchSafety.js";
import { revertDraft } from "../revertDraft.js";
import type { DraftPatch, FixDraft } from "../types.js";

function project(files: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "draft-safety-"));
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  }
  return root;
}

function draft(patches: DraftPatch[]): FixDraft {
  return { draftId: "draft_test", projectId: "p", createdAt: 0, patches, status: "draft" };
}

const replace = (file: string, find: string, value: string): DraftPatch => ({
  type: "replace-text",
  file,
  find,
  replace: value,
  diffPreview: "",
});

test("patch paths stay inside the project and away from .git and node_modules", () => {
  assert.equal(normalizePatchPath("./src/App.tsx"), "src/App.tsx");
  assert.equal(normalizePatchPath("src\\App.tsx"), "src/App.tsx");
  for (const bad of ["../x", "/etc/passwd", "C:/x", "src/../../x", ".git/config", "a/node_modules/b", "", "a//b"]) {
    assert.equal(normalizePatchPath(bad), null, bad);
  }
});

test("a replacement must name text that occurs exactly once", () => {
  const root = project({ "a.ts": "const x = 1;\nconst x = 1;\n", "b.ts": "hello" });
  assert.equal(patchProblem(root, replace("a.ts", "const x = 1;", "y")), "find_not_unique:a.ts");
  assert.equal(patchProblem(root, replace("b.ts", "absent", "y")), "find_not_found:b.ts");
  assert.equal(patchProblem(root, replace("c.ts", "x", "y")), "file_missing:c.ts");
  assert.equal(patchProblem(root, replace("b.ts", "hello", "bye")), null);
});

test("a patch never goes through a symbolic link", () => {
  const outside = project({ "secret.txt": "keep" });
  const root = project({ "a.ts": "x" });
  fs.symlinkSync(outside, path.join(root, "linked"));
  fs.symlinkSync(path.join(outside, "secret.txt"), path.join(root, "file-link.txt"));
  assert.equal(patchProblem(root, replace("linked/secret.txt", "keep", "gone")), "unsafe_patch_link:linked/secret.txt");
  assert.equal(patchProblem(root, replace("file-link.txt", "keep", "gone")), "unsafe_patch_link:file-link.txt");
  assert.equal(fs.readFileSync(path.join(outside, "secret.txt"), "utf8"), "keep");
});

test("a draft is applied whole or not at all", () => {
  const root = project({ "a.ts": "alpha", "b.ts": "beta" });
  const refused = applyDraft(root, draft([replace("a.ts", "alpha", "ALPHA"), replace("b.ts", "missing", "x")]));
  assert.equal(refused.refused, true);
  assert.equal(refused.applied, 0);
  assert.deepEqual(refused.errors, ["find_not_found:b.ts"]);
  assert.equal(fs.readFileSync(path.join(root, "a.ts"), "utf8"), "alpha");

  const applied = applyDraft(root, draft([
    replace("a.ts", "alpha", "ALPHA"),
    { type: "create-file", file: "src/new.ts", content: "new", diffPreview: "" },
    { type: "delete-file", file: "b.ts", diffPreview: "" },
  ]));
  assert.equal(applied.refused, false);
  assert.equal(applied.applied, 3);
  assert.equal(fs.readFileSync(path.join(root, "a.ts"), "utf8"), "ALPHA");
  assert.equal(fs.readFileSync(path.join(root, "src/new.ts"), "utf8"), "new");
  assert.equal(fs.existsSync(path.join(root, "b.ts")), false);
});

test("an empty draft is refused rather than marked applied", () => {
  const root = project({ "a.ts": "x" });
  const result = applyDraft(root, draft([]));
  assert.equal(result.refused, true);
  assert.deepEqual(result.errors, ["draft_has_no_patches"]);
});

test("reverting restores every file, but never over later edits", () => {
  const root = project({ "a.ts": "alpha", "b.ts": "beta" });
  const fix = draft([
    replace("a.ts", "alpha", "ALPHA"),
    { type: "create-file", file: "c.ts", content: "gamma", diffPreview: "" },
    { type: "delete-file", file: "b.ts", diffPreview: "" },
  ]);
  const applied = applyDraft(root, fix);
  fix.snapshots = applied.snapshots;

  fs.writeFileSync(path.join(root, "a.ts"), "ALPHA plus my own work");
  const refused = revertDraft(root, fix);
  assert.equal(refused.refused, true);
  assert.deepEqual(refused.errors, ["changed_since_apply:a.ts"]);
  assert.equal(fs.readFileSync(path.join(root, "a.ts"), "utf8"), "ALPHA plus my own work");
  assert.equal(fs.existsSync(path.join(root, "c.ts")), true);

  fs.writeFileSync(path.join(root, "a.ts"), "ALPHA");
  const reverted = revertDraft(root, fix);
  assert.equal(reverted.refused, false);
  assert.equal(reverted.reverted, 3);
  assert.equal(fs.readFileSync(path.join(root, "a.ts"), "utf8"), "alpha");
  assert.equal(fs.readFileSync(path.join(root, "b.ts"), "utf8"), "beta");
  assert.equal(fs.existsSync(path.join(root, "c.ts")), false);
});
