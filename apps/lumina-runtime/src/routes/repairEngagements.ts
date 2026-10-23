import type { Express, Request, Response } from "express";

import { getProjectMetadata } from "../projects/projectMetadataStore.js";
import { FileEngagementStore, RepairEngagementService, type EngagementAction } from "../repair/RepairEngagements.js";
import { currentRateTable, quoteRepair, type RepairRateTable } from "../repair/RepairRates.js";
import { FileRepositoryIntelligenceStore } from "../repository-intelligence/index.js";
import { decideAuditAccess } from "./auditPolicy.js";
import { requireRuntimeAccess } from "./runtimeAccess.js";
import { getRuntimeCaller, type RuntimeCaller } from "./runtimeCaller.js";

/*
 * MS-2026-0015: paid repair, before payments are wired.
 *
 * A customer who may diagnose a project (ADR-0046) asks for a quote on the
 * findings they picked, then agrees to it; Runtime recomputes the price
 * from the rate table in force and refuses an agreement to any other
 * price. KoreLumina engineers work the engagement from the In-House Dev
 * queue; the customer can follow it and cancel it until work starts.
 */

export interface RepairRouteDependencies {
  reports: Pick<FileRepositoryIntelligenceStore, "loadReport">;
  engagements: RepairEngagementService;
  rates(): RepairRateTable | null;
  caller(req: Request): RuntimeCaller;
  metadata(projectId: string): ReturnType<typeof getProjectMetadata>;
}

export function defaultRepairRouteDependencies(): RepairRouteDependencies {
  return {
    reports: new FileRepositoryIntelligenceStore(),
    engagements: new RepairEngagementService(new FileEngagementStore()),
    rates: () => currentRateTable(),
    caller: getRuntimeCaller,
    metadata: getProjectMetadata,
  };
}

const PROJECT_ID = /^[a-zA-Z0-9._-]{1,128}$/;

export function registerRepairRoutes(app: Express, dependencies: RepairRouteDependencies = defaultRepairRouteDependencies()): void {
  /* The report the customer is diagnosing, if they may ask for its repair. */
  const quoteFor = (req: Request, res: Response) => {
    const caller = dependencies.caller(req);
    const projectId = typeof req.body?.projectId === "string" ? req.body.projectId : "";
    const reportId = typeof req.body?.reportId === "string" ? req.body.reportId : "";
    const findingIds = Array.isArray(req.body?.findingIds) ? req.body.findingIds.filter((id: unknown): id is string => typeof id === "string") : [];
    if (!PROJECT_ID.test(projectId)) return void res.status(400).json({ ok: false, error: "invalid_projectId" });
    if (!caller.userId) return void res.status(403).json({ ok: false, error: "sign_in_required" });
    if (caller.supportAccess) return void res.status(403).json({ ok: false, error: "engineers_do_not_buy_repairs" });
    const access = decideAuditAccess(caller, dependencies.metadata(projectId), "diagnose");
    if (!access.ok) return void res.status(access.status).json({ ok: false, error: access.error });
    const report = dependencies.reports.loadReport(projectId, reportId);
    if (!report) return void res.status(404).json({ ok: false, error: "repository_audit_report_not_found" });
    const quoted = quoteRepair(report.findings, findingIds, dependencies.rates());
    if (!quoted.ok) return void res.status(quoted.error === "repair_rates_not_published" ? 503 : 400).json({ ok: false, error: quoted.error });
    return { caller, projectId, reportId, findingIds: quoted.quote.lines.map((line) => line.findingId), quote: quoted.quote };
  };

  app.post("/api/repair/quote", requireRuntimeAccess, (req, res) => {
    const quoted = quoteFor(req, res);
    if (!quoted) return;
    return res.json({ ok: true, quote: quoted.quote });
  });

  app.post("/api/repair/engagements", requireRuntimeAccess, (req, res) => {
    const quoted = quoteFor(req, res);
    if (!quoted) return;
    /* The customer agrees to a price; it must be the one Runtime computes now. */
    if (req.body?.acceptedTotalCents !== quoted.quote.totalCents || req.body?.rateTableVersion !== quoted.quote.rateTableVersion) {
      return res.status(409).json({ ok: false, error: "the_price_changed_review_the_new_quote", quote: quoted.quote });
    }
    const engagement = dependencies.engagements.create({ customerId: quoted.caller.userId!, projectId: quoted.projectId, reportId: quoted.reportId, findingIds: quoted.findingIds, quote: quoted.quote });
    return res.status(201).json({ ok: true, engagement });
  });

  const actor = (req: Request, res: Response) => {
    const caller = dependencies.caller(req);
    if (!caller.userId) {
      res.status(403).json({ ok: false, error: "sign_in_required" });
      return null;
    }
    return { userId: caller.userId, staff: caller.supportAccess };
  };

  app.get("/api/repair/engagements", requireRuntimeAccess, (req, res) => {
    const who = actor(req, res);
    if (!who) return;
    return res.json({ ok: true, engagements: dependencies.engagements.listFor(who) });
  });

  app.get("/api/repair/engagements/:id", requireRuntimeAccess, (req, res) => {
    const who = actor(req, res);
    if (!who) return;
    const engagement = dependencies.engagements.listFor(who).find((entry) => entry.id === req.params.id);
    if (!engagement) return res.status(404).json({ ok: false, error: "engagement_not_found" });
    return res.json({ ok: true, engagement });
  });

  app.post("/api/repair/engagements/:id/actions", requireRuntimeAccess, (req, res) => {
    const who = actor(req, res);
    if (!who) return;
    const result = dependencies.engagements.act(String(req.params.id), req.body as EngagementAction, who);
    if (!result.ok) return res.status(result.status).json({ ok: false, error: result.error });
    return res.json({ ok: true, engagement: result.engagement });
  });
}
