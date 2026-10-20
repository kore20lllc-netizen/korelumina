import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { countUncommittedRecords, readPlatformFacts, repositoryName, workspaceStack } from "../executivePlatform.js";

test("the repository name is read from https and ssh remotes", () => {
  assert.equal(repositoryName("https://github.com/kore20lllc-netizen/korelumina.git"), "kore20lllc-netizen/korelumina");
  assert.equal(repositoryName("git@github.com:kore20lllc-netizen/korelumina.git"), "kore20lllc-netizen/korelumina");
  assert.equal(repositoryName("https://github.com/owner/repo"), "owner/repo");
  assert.equal(repositoryName(""), null);
});

test("a workspace's stack comes from its dependencies", () => {
  assert.deepEqual(workspaceStack({ dependencies: { react: "18", vite: "5" }, devDependencies: { typescript: "5" } }), ["Vite", "React", "TypeScript"]);
  assert.deepEqual(workspaceStack({}), []);
});

test("platform facts are read from a real repository, and what cannot be read is null", () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "korelumina-platform-"));
  const run = (...args: string[]) => execFileSync("git", args, { cwd: repo, encoding: "utf8" });
  run("init", "-q", "-b", "main");
  run("config", "user.email", "kore20lllc@gmail.com");
  run("config", "user.name", "Owner");
  fs.writeFileSync(path.join(repo, "package.json"), JSON.stringify({ workspaces: ["apps/*"] }));
  fs.mkdirSync(path.join(repo, "apps/runtime"), { recursive: true });
  fs.writeFileSync(path.join(repo, "apps/runtime/package.json"), JSON.stringify({ name: "runtime", dependencies: { express: "4" } }));
  run("add", ".");
  run("commit", "-q", "-m", "feat: first");

  const facts = readPlatformFacts(repo);
  assert.equal(facts.repository, null, "no origin remote");
  assert.equal(facts.branch, "main");
  assert.equal(facts.head?.subject, "feat: first");
  assert.deepEqual(facts.workspaces, [{ path: "apps/runtime", name: "runtime", stack: ["Express"] }]);

  assert.deepEqual(facts.uncommittedRecords, { learningRecords: 0, runtimeRecords: 0 });
  fs.mkdirSync(path.join(repo, "docs/learning"), { recursive: true });
  fs.writeFileSync(path.join(repo, "docs/learning/LR-2026-0001-first.md"), "lesson");
  fs.mkdirSync(path.join(repo, "runtime/executive/missions"), { recursive: true });
  fs.writeFileSync(path.join(repo, "runtime/executive/missions/MS-2026-0001.json"), "{}");
  fs.writeFileSync(path.join(repo, "notes.txt"), "not a record");
  assert.deepEqual(readPlatformFacts(repo).uncommittedRecords, { learningRecords: 1, runtimeRecords: 1 });

  run("remote", "add", "origin", "https://github.com/owner/platform.git");
  assert.equal(readPlatformFacts(repo).repository, "owner/platform");
});

test("uncommitted records are counted from git status lines", () => {
  const porcelain = [" M runtime/executive/missions/MS-2026-0001.json", "?? docs/learning/LR-2026-0022-x.md", "?? runtime-data/genesis/day-zero-certification/current.json", " M apps/x.ts"].join("\n");
  assert.deepEqual(countUncommittedRecords(porcelain), { learningRecords: 1, runtimeRecords: 2 });
});
