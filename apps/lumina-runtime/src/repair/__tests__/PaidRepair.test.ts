import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import express from "express";

import type { ProjectMetadata } from "../../projects/projectMetadataStore.js";
import type { RepositoryFinding } from "../../repository-intelligence/RepositoryFinding.js";
import { registerRepairRoutes } from "../../routes/repairEngagements.js";
import type { RuntimeCaller, RuntimeCallerRole } from "../../routes/runtimeCaller.js";
import { FileEngagementStore, RepairEngagementService } from "../RepairEngagements.js";
import { currentRateTable, quoteRepair, type RepairRateTable } from "../RepairRates.js";

/* MS-2026-0015: priced from the owner's rate table, agreed by the customer, worked by engineers. */

const TABLE: RepairRateTable = {
  version: 1,
  currency: "usd",
  minimumCents: 50000,
  perFindingCents: { critical: 40000, high: 20000, medium: 7500, low: 2500, info: 0 },
  categoryMultiplier: {},
  approvedBy: "human:founder",
  approvedAt: "2026-10-23",
};

const finding = (id: string, severity: RepositoryFinding["severity"], category: RepositoryFinding["category"] = "security"): RepositoryFinding => ({
  id,
  rule: `rule.${id}`,
  category,
  severity,
  title: `Finding ${id}`,
  detail: "",
  packageDirectory: null,
  evidence: [],
  remedy: null,
});
const FINDINGS = [finding("c1", "critical"), finding("c2", "critical"), finding("h1", "high"), finding("h2", "high"), finding("h3", "high"), finding("m1", "medium", "dependency"), finding("m2", "medium"), finding("m3", "medium"), finding("m4", "medium"), finding("m5", "medium"), finding("l1", "low")];

test("the rate table in force is the highest valid version; none means no quotes", () => {
  const root = mkdtempSync(path.join(tmpdir(), "korelumina-rates-"));
  assert.equal(currentRateTable(root), null);
  writeFileSync(path.join(root, "repair-rate-table-v1.json"), JSON.stringify(TABLE));
  writeFileSync(path.join(root, "repair-rate-table-v2.json"), JSON.stringify({ ...TABLE, version: 2, minimumCents: -1 }));
  writeFileSync(path.join(root, "repair-rate-table-v3.json"), "{ broken");
  assert.equal(currentRateTable(root)?.version, 1, "an invalid or unreadable table is never in force");
  writeFileSync(path.join(root, "repair-rate-table-v4.json"), JSON.stringify({ ...TABLE, version: 4, minimumCents: 60000 }));
  assert.equal(currentRateTable(root)?.minimumCents, 60000);
  assert.deepEqual(quoteRepair(FINDINGS, ["c1"], null), { ok: false, error: "repair_rates_not_published" });
});

test("a quote prices each chosen finding by severity, applies the minimum and any category multiplier", () => {
  const big = quoteRepair(FINDINGS, ["c1", "c2", "h1", "h2", "h3", "m1", "m2", "m3", "m4", "m5"], TABLE);
  assert.ok(big.ok);
  assert.equal(big.quote.subtotalCents, 177500, "2 critical + 3 high + 5 medium = $1,775");
  assert.equal(big.quote.totalCents, 177500);
  assert.equal(big.quote.lines[0].severity, "critical");
  const small = quoteRepair(FINDINGS, ["l1", "l1"], TABLE);
  assert.ok(small.ok);
  assert.equal(small.quote.lines.length, 1, "a finding is priced once");
  assert.equal(small.quote.subtotalCents, 2500);
  assert.equal(small.quote.totalCents, 50000, "the minimum applies");
  const weighted = quoteRepair(FINDINGS, ["c1", "m1"], { ...TABLE, categoryMultiplier: { security: 1.5 } });
  assert.ok(weighted.ok);
  assert.equal(weighted.quote.subtotalCents, 60000 + 7500);
  assert.deepEqual(quoteRepair(FINDINGS, [], TABLE), { ok: false, error: "choose_at_least_one_finding" });
  assert.deepEqual(quoteRepair(FINDINGS, ["nope"], TABLE), { ok: false, error: "finding_not_in_report" });
});

const caller = (role: RuntimeCallerRole, userId: string): RuntimeCaller => ({ role, userId, supportAccess: ["inhouse-dev", "admin", "super_admin"].includes(role), adminTools: ["admin", "super_admin"].includes(role) });
const imported = (ownerId: string): ProjectMetadata => ({ projectId: "shop", ownerId, visibility: "private", origin: { kind: "git", provider: "github", host: "github.com", source: "x", importedAt: 1 }, createdAt: 1, updatedAt: 1 });

async function server() {
  const root = mkdtempSync(path.join(tmpdir(), "korelumina-engagements-"));
  const engagements = new RepairEngagementService(new FileEngagementStore(() => root), () => new Date("2026-10-23T12:00:00Z"));
  const app = express();
  app.use(express.json());
  registerRepairRoutes(app, {
    reports: { loadReport: (projectId: string, reportId: string) => (projectId === "shop" && reportId === "r1" ? ({ reportId: "r1", findings: FINDINGS } as never) : null) },
    engagements,
    rates: () => TABLE,
    caller: (req) => {
      const [role, userId] = String(req.header("x-test-caller") ?? "user:").split(":");
      return caller(role as RuntimeCallerRole, userId);
    },
    metadata: () => imported("alice"),
  });
  const listening = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => listening.once("listening", resolve));
  const base = `http://127.0.0.1:${(listening.address() as AddressInfo).port}/api/repair`;
  const call = async (as: string, method: string, url: string, body?: unknown) => {
    const response = await fetch(`${base}${url}`, { method, headers: { "Content-Type": "application/json", "x-test-caller": as }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, body: (await response.json()) as Record<string, any> };
  };
  return { call, close: () => new Promise((resolve) => listening.close(resolve)) };
}

test("a Business owner gets a quote, agrees to that exact price, and engineers work it through to delivery", async () => {
  const api = await server();
  try {
    const ask = { projectId: "shop", reportId: "r1", findingIds: ["c1", "h1"] };
    const quote = await api.call("business:alice", "POST", "/quote", ask);
    assert.equal(quote.status, 200);
    assert.equal(quote.body.quote.totalCents, 60000);

    const tampered = await api.call("business:alice", "POST", "/engagements", { ...ask, acceptedTotalCents: 100, rateTableVersion: 1 });
    assert.equal(tampered.status, 409);
    assert.equal(tampered.body.error, "the_price_changed_review_the_new_quote");

    const agreed = await api.call("business:alice", "POST", "/engagements", { ...ask, acceptedTotalCents: 60000, rateTableVersion: 1 });
    assert.equal(agreed.status, 201);
    const id = agreed.body.engagement.id as string;
    assert.match(id, /^RE-20261023-[0-9a-f]{6}$/);
    assert.equal(agreed.body.engagement.status, "requested");
    assert.equal(agreed.body.engagement.payment, "not_collected");

    assert.equal((await api.call("business:alice", "POST", `/engagements/${id}/actions`, { type: "start" })).status, 403);
    assert.equal((await api.call("inhouse-dev:eng", "POST", `/engagements/${id}/actions`, { type: "start" })).body.error, "take_the_engagement_first");
    assert.equal((await api.call("inhouse-dev:eng", "POST", `/engagements/${id}/actions`, { type: "take" })).status, 200);
    assert.equal((await api.call("inhouse-dev:eng", "POST", `/engagements/${id}/actions`, { type: "start" })).body.engagement.status, "in_progress");
    assert.equal((await api.call("business:alice", "POST", `/engagements/${id}/actions`, { type: "cancel", reason: "changed my mind" })).body.error, "work_has_started_ask_the_team_to_cancel");
    assert.equal((await api.call("inhouse-dev:eng", "POST", `/engagements/${id}/actions`, { type: "submit_for_review" })).body.engagement.status, "in_review");
    assert.equal((await api.call("inhouse-dev:eng", "POST", `/engagements/${id}/actions`, { type: "deliver", delivery: { kind: "pull-request", url: "not a url" } })).status, 400);
    const delivered = await api.call("inhouse-dev:eng", "POST", `/engagements/${id}/actions`, { type: "deliver", delivery: { kind: "pull-request", url: "https://github.com/acme/shop/pull/7", reauditReportId: "r2" } });
    assert.equal(delivered.body.engagement.status, "delivered");
    assert.deepEqual(delivered.body.engagement.history.map((event: { to: string }) => event.to), ["requested", "requested", "in_progress", "in_review", "delivered"]);

    const mine = await api.call("business:alice", "GET", "/engagements");
    assert.equal(mine.body.engagements.length, 1);
    assert.equal((await api.call("business:mallory", "GET", "/engagements")).body.engagements.length, 0, "a customer sees only their own");
    assert.equal((await api.call("business:mallory", "GET", `/engagements/${id}`)).status, 404);
    assert.equal((await api.call("admin:root", "GET", "/engagements")).body.engagements.length, 1, "staff see the whole queue");
  } finally {
    await api.close();
  }
});

test("only customers who may diagnose the project can ask; they may cancel only before work starts", async () => {
  const api = await server();
  try {
    const ask = { projectId: "shop", reportId: "r1", findingIds: ["c1"] };
    assert.equal((await api.call("pro:alice", "POST", "/quote", ask)).body.error, "diagnosis_requires_business_or_enterprise");
    assert.equal((await api.call("business:mallory", "POST", "/quote", ask)).body.error, "forbidden");
    assert.equal((await api.call("admin:root", "POST", "/quote", ask)).body.error, "engineers_do_not_buy_repairs");
    assert.equal((await api.call("business:alice", "POST", "/quote", { ...ask, reportId: "gone" })).status, 404);
    const agreed = await api.call("enterprise:alice", "POST", "/engagements", { ...ask, acceptedTotalCents: 50000, rateTableVersion: 1 });
    const id = agreed.body.engagement.id as string;
    assert.equal((await api.call("enterprise:alice", "POST", `/engagements/${id}/actions`, { type: "cancel", reason: "" })).status, 400);
    const cancelled = await api.call("enterprise:alice", "POST", `/engagements/${id}/actions`, { type: "cancel", reason: "Budget moved to next quarter" });
    assert.equal(cancelled.body.engagement.status, "cancelled");
    assert.equal((await api.call("inhouse-dev:eng", "POST", `/engagements/${id}/actions`, { type: "take" })).body.error, "engagement_is_closed");
  } finally {
    await api.close();
  }
});
