import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  analyzeDependencies,
  classifySpecifier,
  extractImports,
  takeRepositoryInventory,
  takeRepositorySnapshot,
  type RepositoryFinding,
} from "../index.js";

/* MS-2026-0012: dependency findings, read from the code. */

function repository(files: Record<string, string>): string {
  const root = mkdtempSync(path.join(tmpdir(), "korelumina-dependency-analysis-"));
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), content);
  }
  return root;
}

function analyze(files: Record<string, string>) {
  const snapshot = takeRepositorySnapshot(repository(files));
  return analyzeDependencies(snapshot, takeRepositoryInventory(snapshot));
}

function byRule(findings: readonly RepositoryFinding[], rule: string) {
  return findings.filter((finding) => finding.rule === rule);
}

test("imports are read from code only, with their lines", () => {
  const source = [
    'import React, { useState } from "react";',
    "import type { Props } from './props';",
    "// import gone from 'commented-out';",
    "/* import alsoGone from 'block-comment'; */",
    'const options = [{ id: "import", label: "Continue" }];',
    'const generated = `import { motion } from "framer-motion";`;',
    'const command = ["-e", "require(\'@swc/core\')"];',
    'export { thing } from "@scope/pkg/sub";',
    "import 'side-effect';",
    "const lazy = import('lazy-module');",
    "const legacy = require('legacy');",
    "const url = 'https://example.com'; import last from \"last\";",
  ].join("\n");
  assert.deepEqual(
    extractImports(source).map((found) => `${found.line}:${found.kind}:${found.specifier}${found.typeOnly ? ":type" : ""}`),
    [
      "1:static:react",
      "2:static:./props:type",
      "8:re-export:@scope/pkg/sub",
      "9:side-effect:side-effect",
      "10:dynamic:lazy-module",
      "11:require:legacy",
      "12:static:last",
    ],
  );
});

test("an alias is a whole path segment", () => {
  assert.equal(classifySpecifier("@/components/x", ["@"]), "alias");
  assert.equal(classifySpecifier("@radix-ui/react-slot", ["@"]), "package");
  assert.equal(classifySpecifier("~/lib", []), "alias");
  assert.equal(classifySpecifier("node:fs", []), "builtin");
  assert.equal(classifySpecifier("path", []), "builtin");
  assert.equal(classifySpecifier("virtual:pwa-register", []), "virtual");
  assert.equal(classifySpecifier("@app/core", ["@app"]), "alias");
  assert.equal(classifySpecifier("@application/core", ["@app"]), "package");
});

const APP = {
  "package.json": JSON.stringify({
    name: "app",
    dependencies: { react: "^18.3.1", unused: "^1.0.0", both: "^2.0.0", anything: "*", "remote-lib": "github:acme/remote-lib", "@monaco-editor/react": "^4.0.0", "monaco-editor": "^0.50.0", typescript: "^5.0.0" },
    devDependencies: { both: "^2.0.0" },
    scripts: { typecheck: "tsc --noEmit" },
  }),
  "tsconfig.json": '{ // comment\n "compilerOptions": { "paths": { "@/*": ["./src/*"], "#lib/*": ["./lib/*"] }, }, }',
  "src/main.tsx": [
    'import React from "react";',
    'import Editor from "@monaco-editor/react";',
    'import { Button } from "@/components/button";',
    'import { thing } from "#lib/thing";',
    'import { Slot } from "@radix-ui/react-slot";',
    'import { z } from "zod";',
    'import anything from "anything";',
    'import remote from "remote-lib";',
    'import both from "both";',
  ].join("\n"),
  "src/main.test.tsx": 'import { render } from "@testing-library/react";\n',
  "archive/old/page.tsx": 'import Next from "next";\n',
  "node_modules/@monaco-editor/react/package.json": JSON.stringify({ name: "@monaco-editor/react", peerDependencies: { "monaco-editor": ">=0.25", react: "^18" } }),
  "node_modules/typescript/package.json": JSON.stringify({ name: "typescript", bin: { tsc: "./bin/tsc", tsserver: "./bin/tsserver" } }),
};

test("undeclared imports are found, with their severity and evidence", () => {
  const { findings } = analyze(APP);
  const undeclared = byRule(findings, "dependency.undeclared");
  const summary = Object.fromEntries(undeclared.map((finding) => [finding.title.split(" ")[0], finding.severity]));
  assert.deepEqual(summary, { "@radix-ui/react-slot": "high", "@testing-library/react": "medium", next: "low", zod: "high" });
  const slot = undeclared.find((finding) => finding.title.startsWith("@radix-ui/react-slot"))!;
  assert.deepEqual(slot.evidence, [{ file: "src/main.tsx", line: 5, excerpt: 'import { Slot } from "@radix-ui/react-slot";' }]);
  assert.match(undeclared.find((finding) => finding.title.startsWith("next"))!.title, /archived code/);
});

test("unused dependencies exclude peers, commands run by scripts and used packages", () => {
  const { findings } = analyze(APP);
  assert.deepEqual(byRule(findings, "dependency.possibly-unused").map((finding) => finding.title), ["unused looks unused"]);
});

test("declared twice, unpinned and remote sources are reported", () => {
  const { findings } = analyze(APP);
  assert.deepEqual(byRule(findings, "dependency.declared-twice").map((finding) => finding.title), ["both is in both dependencies and devDependencies"]);
  assert.deepEqual(byRule(findings, "dependency.unpinned").map((finding) => finding.severity), ["medium"]);
  assert.deepEqual(byRule(findings, "dependency.remote-source").map((finding) => finding.title), ["remote-lib is installed from a remote source"]);
  assert.equal(byRule(findings, "dependency.no-lockfile").length, 1);
});

test("workspace packages: root hoisting and undeclared workspace imports", () => {
  const { findings } = analyze({
    "package.json": JSON.stringify({ name: "mono", private: true, workspaces: ["apps/*", "packages/*"], devDependencies: { lodash: "^4.17.21" } }),
    "package-lock.json": JSON.stringify({ lockfileVersion: 3, packages: { "": { devDependencies: { lodash: "^4.17.21" } }, "apps/web": {}, "packages/ui": {} } }),
    "apps/web/package.json": JSON.stringify({ name: "web" }),
    "apps/web/src/index.ts": 'import _ from "lodash";\nimport { Button } from "@mono/ui";\n',
    "packages/ui/package.json": JSON.stringify({ name: "@mono/ui" }),
    "packages/ui/src/index.ts": "export const Button = 1;\n",
  });
  assert.deepEqual(byRule(findings, "dependency.relies-on-root").map((finding) => [finding.packageDirectory, finding.title]), [
    ["apps/web", "lodash is used by apps/web but only declared at the root"],
  ]);
  assert.deepEqual(byRule(findings, "dependency.undeclared-workspace-package").map((finding) => finding.remedy), [
    'Add "@mono/ui": "workspace:*" (or its version) to apps/web/package.json.',
  ]);
  assert.equal(byRule(findings, "dependency.stale-lockfile").length, 0);
});

test("a lockfile that disagrees with package.json is stale, as npm ci would say", () => {
  const { findings, lockfilesChecked } = analyze({
    "package.json": JSON.stringify({ name: "app", dependencies: { react: "^18.3.1", added: "^1.0.0" } }),
    "package-lock.json": JSON.stringify({ lockfileVersion: 3, packages: { "": { dependencies: { react: "^18.2.0", removed: "^2.0.0" } } } }),
    "src/index.ts": 'import "react";\nimport "added";\n',
  });
  assert.deepEqual(lockfilesChecked, ["package-lock.json"]);
  const stale = byRule(findings, "dependency.stale-lockfile");
  assert.equal(stale.length, 1);
  assert.match(stale[0]!.detail, /react is declared as \^18\.3\.1 but locked as \^18\.2\.0/);
  assert.match(stale[0]!.detail, /added is declared but not locked/);
  assert.match(stale[0]!.detail, /removed is locked but no longer declared/);
});

test("lockfiles from two package managers conflict", () => {
  const { findings } = analyze({
    "package.json": JSON.stringify({ name: "app", dependencies: { react: "^18" } }),
    "package-lock.json": "{}",
    "yarn.lock": "",
    "src/index.ts": 'import "react";\n',
  });
  assert.deepEqual(byRule(findings, "dependency.conflicting-lockfiles")[0]!.evidence, [{ file: "package-lock.json" }, { file: "yarn.lock" }]);
});

test("the same repository gives the same findings, with stable IDs", () => {
  const first = analyze(APP).findings;
  const second = analyze(APP).findings;
  assert.deepEqual(second, first);
  assert.equal(new Set(first.map((finding) => finding.id)).size, first.length);
});
