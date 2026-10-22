import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  FileRepositoryIntelligenceStore,
  createFinding,
  gradeOf,
  runRepositoryAudit,
  scoreCategory,
  summarize,
  type AuditCommandRunner,
  type AuditProgress,
  type ProcessRunner,
  type RepositoryFinding,
} from "../index.js";

/* MS-2026-0012: one audit run, its scores, its history. */

function repository(files: Record<string, string>): string {
  const root = mkdtempSync(path.join(tmpdir(), "korelumina-repository-audit-"));
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), content);
  }
  return root;
}

function finding(rule: string, category: RepositoryFinding["category"], severity: RepositoryFinding["severity"], identity: string): RepositoryFinding {
  return createFinding({ identity, rule, category, severity, title: rule, detail: "", packageDirectory: ".", evidence: [], remedy: null });
}

test("a category score is 100 minus capped deductions per rule", () => {
  assert.equal(scoreCategory([]), 100);
  assert.equal(scoreCategory([finding("a", "security", "high", "1"), finding("b", "security", "medium", "2")]), 84);
  /* 40 low findings of one rule cost 25, not 40; one critical still costs its full 30. */
  assert.equal(scoreCategory(Array.from({ length: 40 }, (_, index) => finding("noisy", "security", "low", String(index)))), 75);
  assert.equal(scoreCategory([finding("one", "security", "critical", "1")]), 70);
  assert.equal(scoreCategory(Array.from({ length: 5 }, (_, index) => finding(`rule-${index}`, "security", "critical", String(index)))), 0);
  assert.deepEqual([95, 80, 65, 45, 10].map(gradeOf), ["A", "B", "C", "D", "F"]);
});

test("unchecked categories are left out of the score; a critical finding caps it", () => {
  const clean = summarize([], { build: { status: "not-checked", notes: ["Build health runs in the deep audit."] } });
  assert.equal(clean.score, 100);
  assert.equal(clean.categories.find((category) => category.category === "build")!.score, null);

  const critical = summarize([finding("security.secret.github-token", "security", "critical", "x")], {});
  assert.equal(critical.categories.find((category) => category.category === "security")!.score, 70);
  assert.equal(critical.score, 49);
  assert.equal(critical.grade, "D");

  const nothing = summarize([], {
    security: { status: "not-checked", notes: [] },
    build: { status: "not-checked", notes: [] },
    dependency: { status: "not-checked", notes: [] },
    architecture: { status: "not-checked", notes: [] },
    environment: { status: "not-checked", notes: [] },
  });
  assert.deepEqual({ score: nothing.score, grade: nothing.grade }, { score: null, grade: null });
});

const PROJECT = {
  "package.json": JSON.stringify({ name: "app", scripts: { build: "vite build" }, dependencies: { react: "^18.3.1" }, devDependencies: { typescript: "^5" } }),
  "package-lock.json": JSON.stringify({ lockfileVersion: 3, packages: { "": { dependencies: { react: "^18.3.1" }, devDependencies: { typescript: "^5" } } } }),
  "tsconfig.json": '{ "include": ["src"] }',
  "index.html": '<script type="module" src="/src/main.tsx"></script>',
  "src/main.tsx": 'import React from "react";\nimport { z } from "zod";\nexport const key = process.env.API_KEY;\n',
  "node_modules/.bin/tsc": "",
};

const offline: AuditCommandRunner = async () => ({ stdout: JSON.stringify({ message: "403 Forbidden", statusCode: 403, error: { summary: "" } }), stderr: "", exitCode: 1, timedOut: false });
const passing: ProcessRunner = async () => ({ stdout: "", stderr: "", exitCode: 0, timedOut: false });

test("a scan reports every stage, its coverage, and what it could not check", async () => {
  const events: AuditProgress[] = [];
  const report = await runRepositoryAudit({ projectId: "app", root: repository(PROJECT), mode: "scan", runAudit: offline, onProgress: (event) => events.push(event), now: () => 1000 });
  assert.deepEqual(
    events.filter((event) => event.state !== "started").map((event) => `${event.stage}:${event.state}`),
    ["snapshot:completed", "inventory:completed", "dependencies:completed", "secrets:completed", "code:completed", "environment:completed", "architecture:completed", "advisories:completed", "build:skipped", "report:completed"],
  );
  assert.equal(report.coverage.advisories.status, "unavailable");
  assert.match(report.coverage.advisories.reason!, /403 Forbidden/);
  const status = Object.fromEntries(report.summary.categories.map((category) => [category.category, category.status]));
  assert.deepEqual(status, { security: "partial", build: "not-checked", dependency: "checked", architecture: "checked", environment: "checked" });
  assert.deepEqual(report.findings.map((item) => item.rule).sort(), ["dependency.undeclared", "environment.no-example-file"]);
  /* security 100 (partial), dependency 88, architecture 100, environment 96; weighted 30/20/15/10. */
  assert.equal(report.summary.score, 96);
  assert.equal(report.comparison, null);
  assert.deepEqual(report.environmentVariables, [{ name: "API_KEY", packageDirectory: ".", public: false, documented: false }]);
});

test("a deep audit includes build health; reports are kept with what changed between them", async () => {
  const root = repository(PROJECT);
  const store = new FileRepositoryIntelligenceStore();
  let clock = 1000;
  const first = await runRepositoryAudit({ projectId: "app", root, mode: "deep", runAudit: offline, runProcess: passing, now: () => clock++ });
  assert.deepEqual(first.coverage.build.map((check) => `${check.check}:${check.status}`), ["typecheck:passed", "build:passed"]);
  assert.equal(first.summary.categories.find((category) => category.category === "build")!.status, "checked");
  store.saveReport(first);

  writeFileSync(path.join(root, "src/main.tsx"), 'import React from "react";\nexport const key = process.env.API_KEY;\nexport const other = process.env.SECOND_KEY;\n');
  clock = 5000;
  const second = await runRepositoryAudit({ projectId: "app", root, mode: "deep", runAudit: offline, runProcess: passing, previous: store.latestReport("app"), now: () => clock++ });
  store.saveReport(second);

  const undeclared = first.findings.find((item) => item.rule === "dependency.undeclared")!.id;
  assert.ok(second.comparison!.resolvedFindings.includes(undeclared));
  assert.equal(second.comparison!.previousReportId, first.reportId);
  assert.notEqual(second.manifest.manifestId, first.manifest.manifestId);

  assert.deepEqual(store.listReports("app").map((item) => item.reportId), [second.reportId, first.reportId]);
  assert.equal(store.latestReport("app")!.reportId, second.reportId);
  assert.equal(store.loadReport("app", first.reportId)!.startedAt, 1000);
  assert.equal(store.listManifests("app").length, 2);
});
