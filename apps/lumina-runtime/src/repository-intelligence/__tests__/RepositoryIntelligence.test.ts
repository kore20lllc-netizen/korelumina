import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  FileRepositoryIntelligenceStore,
  createRepositoryIntelligenceManifest,
  takeRepositoryInventory,
  takeRepositorySnapshot,
} from "../index.js";
import { GitIgnoreMatcher } from "../GitIgnore.js";
import { readGitTrackedPaths } from "../GitIndex.js";

/* MS-2026-0012: Repository Intelligence inventory and manifest. */

function repository(files: Record<string, string>): string {
  const root = mkdtempSync(path.join(tmpdir(), "korelumina-repository-intelligence-"));
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), content);
  }
  return root;
}

/* A git index (format 2) listing these paths, as git writes it. */
function gitIndex(entries: { path: string; mode?: number }[]): Buffer {
  const parts: Buffer[] = [];
  const header = Buffer.alloc(12);
  header.write("DIRC", 0, "ascii");
  header.writeUInt32BE(2, 4);
  header.writeUInt32BE(entries.length, 8);
  parts.push(header);
  for (const entry of [...entries].sort((left, right) => (left.path < right.path ? -1 : 1))) {
    const name = Buffer.from(entry.path, "utf8");
    const length = (62 + name.length + 8) & ~7;
    const record = Buffer.alloc(length);
    record.writeUInt32BE(entry.mode ?? 0o100644, 24);
    createHash("sha1").update(entry.path).digest().copy(record, 40);
    record.writeUInt16BE(Math.min(name.length, 0xfff), 60);
    name.copy(record, 62);
    parts.push(record);
  }
  return Buffer.concat(parts);
}

const MONOREPO = {
  "package.json": JSON.stringify({ name: "acme", private: true, workspaces: ["apps/*", "packages/*"] }),
  "package-lock.json": "{}",
  "pnpm-lock.yaml": "lockfileVersion: 9\n",
  ".gitignore": "node_modules/\n.env\n.env.local\ncoverage/\n/generated/\n",
  ".env": "SECRET_TOKEN=do-not-keep\n",
  ".env.example": "API_URL=\n",
  "README.md": "# Acme\n",
  "apps/web/package.json": JSON.stringify({
    name: "web",
    dependencies: { react: "^18.3.1", "react-dom": "^18.3.1" },
    devDependencies: { vite: "^5.4.0", typescript: "^5.6.0", vitest: "^2.0.0" },
    scripts: { build: "vite build", dev: "vite" },
  }),
  "apps/web/index.html": '<div id="root"></div><script type="module" src="/src/main.tsx"></script>',
  "apps/web/src/main.tsx": "import React from 'react';\nexport const app = 1;\n",
  "apps/web/tsconfig.json": "{}",
  "apps/api/package.json": JSON.stringify({ name: "api", main: "dist/server.js", dependencies: { express: "^4.19.2" } }),
  "apps/api/src/server.ts": "export {};\n",
  "packages/ui/package.json": JSON.stringify({ name: "@acme/ui", peerDependencies: { react: "^18" } }),
  "packages/ui/src/index.ts": "export const Button = 1;\n",
  "docs/notes/package.json": JSON.stringify({ name: "not-a-workspace" }),
  "generated/big.json": "{}",
  "node_modules/react/index.js": "module.exports = {};\n",
  "coverage/report.html": "<html></html>",
};

test("gitignore follows git's rules", () => {
  const ignore = new GitIgnoreMatcher();
  ignore.add("", "*.log\n!keep.log\n/build/\ndocs/**/draft.md\nsecret?.txt\n");
  ignore.add("apps/web", "local/\n");
  assert.equal(ignore.ignores("a/debug.log", false), true);
  assert.equal(ignore.ignores("keep.log", false), false);
  assert.equal(ignore.ignores("build", true), true);
  assert.equal(ignore.ignores("src/build", true), false);
  assert.equal(ignore.ignores("build", false), false);
  assert.equal(ignore.ignores("docs/draft.md", false), true);
  assert.equal(ignore.ignores("docs/a/b/draft.md", false), true);
  assert.equal(ignore.ignores("secret1.txt", false), true);
  assert.equal(ignore.ignores("apps/web/local", true), true);
  assert.equal(ignore.ignores("apps/api/local", true), false);
  assert.equal(ignore.ignoresWithAncestors("build/out/app.js", false), true);
});

test("the git index gives tracked paths and leaves out submodules", () => {
  const root = repository({ "a.txt": "a" });
  mkdirSync(path.join(root, ".git"));
  writeFileSync(
    path.join(root, ".git", "index"),
    gitIndex([{ path: "a.txt" }, { path: "src/deep/file.ts" }, { path: "vendor/lib", mode: 0o160000 }]),
  );
  assert.deepEqual([...readGitTrackedPaths(root)!].sort(), ["a.txt", "src/deep/file.ts"]);
  assert.equal(readGitTrackedPaths(repository({})), null);
});

test("the snapshot skips generated and ignored directories, and never keeps .env content", () => {
  const snapshot = takeRepositorySnapshot(repository(MONOREPO));
  const paths = snapshot.files.map((file) => file.path);
  assert.ok(!paths.some((file) => file.startsWith("node_modules/") || file.startsWith("coverage/") || file.startsWith("generated/")));
  assert.deepEqual(snapshot.skippedDirectories, ["coverage", "generated", "node_modules"]);
  assert.equal(snapshot.files.find((file) => file.path === ".env")?.ignored, true);
  assert.equal(snapshot.read(".env"), null);
  assert.equal(snapshot.read(".env.example"), "API_URL=\n");
  assert.equal(snapshot.commit, null);
  assert.equal(snapshot.files.every((file) => file.tracked === null), true);
});

test("a committed file stays tracked even when .gitignore now covers it", () => {
  const root = repository({ ".gitignore": ".env\nlegacy/\n", ".env": "X=1\n", "legacy/kept.ts": "export {};\n", "legacy/local.ts": "export {};\n", "src/a.ts": "" });
  mkdirSync(path.join(root, ".git"));
  writeFileSync(path.join(root, ".git", "index"), gitIndex([{ path: ".gitignore" }, { path: ".env" }, { path: "legacy/kept.ts" }, { path: "src/a.ts" }]));
  const snapshot = takeRepositorySnapshot(root);
  const file = (name: string) => snapshot.files.find((entry) => entry.path === name);
  assert.deepEqual({ ignored: file(".env")?.ignored, tracked: file(".env")?.tracked }, { ignored: false, tracked: true });
  assert.deepEqual({ ignored: file("legacy/kept.ts")?.ignored, tracked: file("legacy/kept.ts")?.tracked }, { ignored: false, tracked: true });
  assert.deepEqual({ ignored: file("legacy/local.ts")?.ignored, tracked: file("legacy/local.ts")?.tracked }, { ignored: true, tracked: false });
});

test("the same content gives the same fingerprint; ignored local files do not change it", () => {
  const first = takeRepositorySnapshot(repository(MONOREPO));
  const second = takeRepositorySnapshot(repository(MONOREPO));
  assert.equal(first.fingerprint, second.fingerprint);
  const withLocal = takeRepositorySnapshot(repository({ ...MONOREPO, ".env.local": "LOCAL=1\n" }));
  assert.equal(withLocal.fingerprint, first.fingerprint);
  const changed = takeRepositorySnapshot(repository({ ...MONOREPO, "README.md": "# Acme 2\n" }));
  assert.notEqual(changed.fingerprint, first.fingerprint);
});

test("the inventory reads a monorepo from its files", () => {
  const inventory = takeRepositoryInventory(takeRepositorySnapshot(repository(MONOREPO)));

  assert.deepEqual(inventory.packageManager, {
    manager: "npm",
    lockfiles: ["package-lock.json", "pnpm-lock.yaml"],
    conflicting: true,
    declared: null,
  });
  assert.deepEqual(inventory.workspaceGlobs, ["apps/*", "packages/*"]);
  assert.deepEqual(
    inventory.packages.map((entry) => entry.directory),
    [".", "apps/api", "apps/web", "packages/ui"],
  );

  const web = inventory.packages.find((entry) => entry.directory === "apps/web")!;
  assert.deepEqual(web.frameworks.map((framework) => `${framework.id}@${framework.version}`), ["react@^18.3.1", "vite@^5.4.0"]);
  assert.deepEqual(web.tooling, ["typescript", "vitest"]);
  assert.deepEqual(web.entryPoints, ["apps/web/src/main.tsx"]);
  assert.deepEqual(web.scripts, { build: "vite build", dev: "vite" });

  const api = inventory.packages.find((entry) => entry.directory === "apps/api")!;
  assert.deepEqual(api.frameworks.map((framework) => framework.id), ["express"]);
  assert.deepEqual(api.entryPoints, ["apps/api/dist/server.js", "apps/api/src/server.ts"]);

  assert.deepEqual(
    inventory.environmentFiles,
    [
      { path: ".env", ignored: true, tracked: null },
      { path: ".env.example", ignored: false, tracked: null },
    ],
  );
  assert.equal(inventory.languages[0]!.language, "JSON");
  assert.ok(inventory.languages.some((share) => share.language === "TypeScript" && share.files === 3));
  assert.deepEqual(inventory.documentation, ["README.md"]);
});

test("a broken package.json is reported, not fatal", () => {
  const inventory = takeRepositoryInventory(
    takeRepositorySnapshot(repository({ "package.json": "{ not json", "src/index.ts": "" })),
  );
  assert.equal(inventory.packages.length, 1);
  assert.ok(inventory.packages[0]!.parseError);
});

test("manifests are kept per snapshot, newest first, and the same snapshot keeps one record", () => {
  const store = new FileRepositoryIntelligenceStore();
  const root = repository(MONOREPO);
  const snapshot = takeRepositorySnapshot(root);
  const inventory = takeRepositoryInventory(snapshot);
  const first = createRepositoryIntelligenceManifest({ projectId: "acme", snapshot, inventory, analyzedAt: 1 });
  const again = createRepositoryIntelligenceManifest({ projectId: "acme", snapshot, inventory, analyzedAt: 2 });
  assert.equal(first.manifestId, again.manifestId);
  store.saveManifest(first);
  store.saveManifest(again);
  assert.equal(store.listManifests("acme").length, 1);

  const changedSnapshot = takeRepositorySnapshot(repository({ ...MONOREPO, "README.md": "# changed\n" }));
  const changed = createRepositoryIntelligenceManifest({
    projectId: "acme",
    snapshot: changedSnapshot,
    inventory: takeRepositoryInventory(changedSnapshot),
    analyzedAt: 3,
  });
  store.saveManifest(changed);
  assert.deepEqual(store.listManifests("acme").map((manifest) => manifest.analyzedAt), [3, 2]);
  assert.equal(store.latestManifest("acme")?.manifestId, changed.manifestId);
  assert.equal(store.latestManifest("unknown"), null);
  assert.throws(() => store.listManifests("../escape"), /repository_intelligence_invalid_project_id/);
});
