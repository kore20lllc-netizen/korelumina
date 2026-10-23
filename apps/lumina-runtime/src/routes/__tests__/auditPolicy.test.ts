import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";

import express from "express";

import type { ProjectMetadata } from "../../projects/projectMetadataStore.js";
import { registerApplyDraftRoute } from "../applyDraft.js";
import { registerAuditRoute } from "../audit.js";
import { decideAuditAccess, type AuditAction } from "../auditPolicy.js";
import { registerCreateDraftRoute } from "../createDraft.js";
import { registerFixPlanRoute } from "../fixPlan.js";
import { registerGenerateFixesRoute } from "../generateFixes.js";
import type { RuntimeCaller, RuntimeCallerRole } from "../runtimeCaller.js";

/* ADR-0046: Business and Enterprise diagnose imported projects; repair, the fix plan and the deep audit are in-house. */

const caller = (role: RuntimeCallerRole, userId = "alice"): RuntimeCaller => ({
  role,
  userId,
  supportAccess: role === "inhouse-dev" || role === "admin" || role === "super_admin",
  adminTools: role === "admin" || role === "super_admin",
});

const imported: ProjectMetadata = {
  projectId: "shop",
  ownerId: "alice",
  visibility: "private",
  origin: { kind: "git", provider: "github", host: "github.com", source: "https://github.com/a/shop.git", importedAt: 1 },
  createdAt: 1,
  updatedAt: 1,
};
const built: ProjectMetadata = { ...imported, origin: { kind: "built", createdAt: 1 } };
const ACTIONS: AuditAction[] = ["diagnose", "read-report", "deep-audit", "repair", "edit"];

function table(who: RuntimeCaller, metadata: ProjectMetadata | null) {
  return Object.fromEntries(ACTIONS.map((action) => {
    const decision = decideAuditAccess(who, metadata, action);
    return [action, decision.ok ? "allowed" : decision.error];
  }));
}

test("every role on its own imported project", () => {
  const refusedRepair = "repair_is_done_by_korelumina_engineers";
  for (const role of ["user", "pro"] as const) {
    assert.deepEqual(table(caller(role), imported), {
      diagnose: "diagnosis_requires_business_or_enterprise",
      "read-report": "diagnosis_requires_business_or_enterprise",
      "deep-audit": refusedRepair,
      repair: refusedRepair,
      edit: "allowed",
    }, role);
  }
  for (const role of ["business", "enterprise"] as const) {
    assert.deepEqual(table(caller(role), imported), { diagnose: "allowed", "read-report": "allowed", "deep-audit": refusedRepair, repair: refusedRepair, edit: "allowed" }, role);
  }
  for (const role of ["inhouse-dev", "admin", "super_admin"] as const) {
    assert.deepEqual(table(caller(role, "staff"), imported), { diagnose: "allowed", "read-report": "allowed", "deep-audit": "allowed", repair: "allowed", edit: "allowed" }, role);
  }
});

test("a customer cannot diagnose someone else's project, or a project not imported", () => {
  assert.deepEqual(decideAuditAccess(caller("business", "mallory"), imported, "diagnose"), { ok: false, status: 403, error: "forbidden" });
  assert.deepEqual(decideAuditAccess(caller("business", "mallory"), imported, "edit"), { ok: false, status: 403, error: "forbidden" });
  assert.deepEqual(decideAuditAccess(caller("enterprise"), built, "diagnose"), { ok: false, status: 403, error: "diagnosis_is_for_imported_projects" });
  assert.deepEqual(decideAuditAccess(caller("enterprise"), { ...imported, origin: undefined }, "read-report"), { ok: false, status: 403, error: "diagnosis_is_for_imported_projects" });
  assert.deepEqual(decideAuditAccess(caller("business", ""), null, "diagnose"), { ok: false, status: 403, error: "forbidden" });
});

test("the earlier audit and repair routes are no longer open (F-44)", async () => {
  const app = express();
  app.use(express.json());
  registerAuditRoute(app);
  registerFixPlanRoute(app);
  registerGenerateFixesRoute(app);
  registerCreateDraftRoute(app);
  registerApplyDraftRoute(app);
  const listening = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => listening.once("listening", resolve));
  const base = `http://127.0.0.1:${(listening.address() as AddressInfo).port}`;
  const as = (role: string) => ({ "Content-Type": "application/json", "x-korelumina-role": role, "x-korelumina-user-id": "mallory" });
  try {
    for (const role of ["user", "pro", "business", "enterprise"]) {
      assert.equal((await fetch(`${base}/api/runtime/audit?projectId=victim`, { headers: as(role) })).status, 403, `audit ${role}`);
      assert.equal((await fetch(`${base}/api/runtime/fix-plan`, { method: "POST", headers: as(role), body: JSON.stringify({ projectId: "victim" }) })).status, 403, `fix-plan ${role}`);
      assert.equal((await fetch(`${base}/api/runtime/generate-fixes`, { method: "POST", headers: as(role), body: JSON.stringify({ projectId: "victim" }) })).status, 403, `generate-fixes ${role}`);
    }
    const edit = await fetch(`${base}/api/runtime/drafts/create`, { method: "POST", headers: as("business"), body: JSON.stringify({ projectId: "someone-elses-project", prompt: "delete everything" }) });
    assert.equal(edit.status, 403);
    assert.equal((await fetch(`${base}/api/runtime/apply-draft`, { method: "POST", headers: as("business"), body: JSON.stringify({ draftId: "unknown" }) })).status, 404);
  } finally {
    await new Promise((resolve) => listening.close(resolve));
  }
});
