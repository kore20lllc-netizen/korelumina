import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import express from "express";

import { FileRepositoryIntelligenceStore, RepositoryAuditRuns } from "../../repository-intelligence/index.js";
import { registerRepositoryAuditRoutes } from "../repositoryAudit.js";

/* MS-2026-0012: the Repo Audit API, against a real server. */

function repository(files: Record<string, string>): string {
  const root = mkdtempSync(path.join(tmpdir(), "korelumina-audit-route-"));
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), content);
  }
  return root;
}

async function server(options: { staff: boolean }) {
  const project = repository({
    "package.json": JSON.stringify({ name: "app", dependencies: { react: "^18" } }),
    "src/main.ts": 'import React from "react";\nimport { z } from "zod";\n',
  });
  const store = new FileRepositoryIntelligenceStore({ storageRoot: mkdtempSync(path.join(tmpdir(), "korelumina-audit-store-")) });
  const runs = new RepositoryAuditRuns(store);
  const app = express();
  app.use(express.json());
  registerRepositoryAuditRoutes(app, {
    store,
    runs,
    projectRoot: (projectId) => (projectId === "app" ? project : null),
    /* ADR-0046: customers diagnose; the deep audit and the fix plan are for staff. */
    authorize: (_req, _projectId, action) =>
      options.staff || action === "diagnose" || action === "read-report" ? { ok: true } : { ok: false, status: 403, error: "repair_is_done_by_korelumina_engineers" },
  });
  const listening = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => listening.once("listening", resolve));
  const base = `http://127.0.0.1:${(listening.address() as AddressInfo).port}/api/runtime/repository-audit`;
  return {
    base,
    runs,
    close: () => new Promise((resolve) => listening.close(resolve)),
    post: (body: unknown) => fetch(`${base}/runs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  };
}

async function readEvents(url: string): Promise<{ event: string; data: { type: string; progress?: { stage: string; state: string }; reportId?: string } }[]> {
  const response = await fetch(url);
  assert.equal(response.headers.get("content-type"), "text/event-stream");
  const text = await response.text();
  return text
    .split("\n\n")
    .filter((block) => block.trim())
    .map((block) => {
      const event = block.match(/^event: (.+)$/m)![1]!;
      const data = JSON.parse(block.match(/^data: (.+)$/m)![1]!);
      return { event, data };
    });
}

test("a scan streams its progress, then its report, history and fix plan can be read", async () => {
  const api = await server({ staff: false });
  try {
    const started = await api.post({ projectId: "app", mode: "scan", checkAdvisories: false });
    assert.equal(started.status, 202);
    const { runId } = (await started.json()) as { runId: string };

    const events = await readEvents(`${api.base}/runs/${encodeURIComponent(runId)}/events`);
    assert.equal(events.at(-1)!.event, "completed");
    assert.ok(events.some((item) => item.data.progress?.stage === "architecture" && item.data.progress.state === "completed"));
    const reportId = events.at(-1)!.data.reportId!;

    const run = (await (await fetch(`${api.base}/runs/${encodeURIComponent(runId)}`)).json()) as { run: { status: string; reportId: string } };
    assert.deepEqual({ status: run.run.status, reportId: run.run.reportId }, { status: "completed", reportId });

    const latest = (await (await fetch(`${api.base}/app/latest`)).json()) as { report: { reportId: string; findings: { rule: string }[] } };
    assert.equal(latest.report.reportId, reportId);
    assert.ok(latest.report.findings.some((finding) => finding.rule === "dependency.undeclared"));

    const history = (await (await fetch(`${api.base}/app/reports`)).json()) as { reports: { reportId: string }[] };
    assert.deepEqual(history.reports.map((item) => item.reportId), [reportId]);

    /* A customer diagnoses; the ordered fix plan is in-house (ADR-0046). */
    const refusedPlan = await fetch(`${api.base}/app/reports/${encodeURIComponent(reportId)}/fix-plan`);
    assert.equal(refusedPlan.status, 403);
    assert.equal(((await refusedPlan.json()) as { error: string }).error, "repair_is_done_by_korelumina_engineers");
    const staff = await server({ staff: true });
    const plan = await (async () => {
      try {
        const started = (await (await staff.post({ projectId: "app", mode: "scan", checkAdvisories: false })).json()) as { runId: string };
        const done = await readEvents(`${staff.base}/runs/${encodeURIComponent(started.runId)}/events`);
        const staffReport = done.at(-1)!.data.reportId!;
        return (await (await fetch(`${staff.base}/app/reports/${encodeURIComponent(staffReport)}/fix-plan`)).json()) as { steps: { rule: string; remedies: string[]; automated: boolean }[] };
      } finally {
        await staff.close();
      }
    })();
    const undeclared = plan.steps.find((step) => step.rule === "dependency.undeclared")!;
    assert.deepEqual(undeclared.remedies, ["Add zod to dependencies in package.json."]);
    assert.equal(undeclared.automated, false);
  } finally {
    await api.close();
  }
});

test("one audit runs per project at a time", async () => {
  const api = await server({ staff: false });
  try {
    const first = (await (await api.post({ projectId: "app", checkAdvisories: false })).json()) as { runId: string };
    const second = await api.post({ projectId: "app", checkAdvisories: false });
    assert.equal(second.status, 409);
    assert.equal(((await second.json()) as { runId: string }).runId, first.runId);
    await readEvents(`${api.base}/runs/${encodeURIComponent(first.runId)}/events`);
  } finally {
    await api.close();
  }
});

test("the deep audit runs project code, so it is for staff only", async () => {
  const api = await server({ staff: false });
  try {
    const refused = await api.post({ projectId: "app", mode: "deep" });
    assert.equal(refused.status, 403);
    assert.equal(api.runs.runningFor("app"), null);
  } finally {
    await api.close();
  }
});

test("unknown projects, invalid IDs and missing reports are refused", async () => {
  const api = await server({ staff: true });
  try {
    assert.equal((await api.post({ projectId: "nope" })).status, 404);
    assert.equal((await api.post({ projectId: "../etc" })).status, 400);
    assert.equal((await fetch(`${api.base}/app/latest`)).status, 404);
    assert.equal((await fetch(`${api.base}/runs/unknown`)).status, 404);
  } finally {
    await api.close();
  }
});
