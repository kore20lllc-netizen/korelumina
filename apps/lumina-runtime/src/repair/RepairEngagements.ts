import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { isNodeTestProcess, isolatedTestStorageRoot, resolveRepositoryRoot } from "../knowledge-preservation/storage/resolveKnowledgeStorageRoot.js";
import type { RepairQuote } from "./RepairRates.js";

/*
 * MS-2026-0015: a repair engagement, from the customer's agreement to
 * delivery. It is the record the In-House Dev queue works from.
 *
 *   requested -> held -> in_progress -> in_review -> delivered
 *   requested | held | in_progress | in_review -> cancelled
 *   in_review -> in_progress (changes needed)
 *
 * "held" is the card hold (Stripe, wired last). Until payments exist an
 * engineer may start a requested engagement; the record says no payment
 * was collected. Every change is appended to the history with who made it.
 * Engagements hold customer data, so they live in runtime-data, not git.
 */

export type EngagementStatus = "requested" | "held" | "in_progress" | "in_review" | "delivered" | "cancelled";

export interface EngagementEvent {
  at: string;
  actor: string;
  from: EngagementStatus | null;
  to: EngagementStatus;
  note: string | null;
}

export interface EngagementDelivery {
  kind: "pull-request" | "download";
  url: string | null;
  reauditReportId: string | null;
}

export interface RepairEngagement {
  id: string;
  customerId: string;
  projectId: string;
  reportId: string;
  findingIds: string[];
  quote: RepairQuote;
  status: EngagementStatus;
  payment: "not_collected" | "held" | "captured" | "released";
  assignee: string | null;
  delivery: EngagementDelivery | null;
  createdAt: string;
  updatedAt: string;
  history: EngagementEvent[];
}

export function resolveEngagementRoot(): string {
  const configured = process.env.KORELUMINA_REPAIR_ENGAGEMENT_ROOT?.trim();
  if (configured) return path.resolve(configured);
  if (isNodeTestProcess()) return isolatedTestStorageRoot("repair-engagements");
  return path.join(resolveRepositoryRoot(), "runtime-data", "repair", "engagements");
}

export class FileEngagementStore {
  constructor(private readonly root: () => string = resolveEngagementRoot) {}

  private file(id: string): string {
    if (!/^RE-\d{8}-[0-9a-f]{6}$/.test(id)) throw new Error("invalid_engagement_id");
    return path.join(this.root(), `${id}.json`);
  }

  get(id: string): RepairEngagement | null {
    try {
      const file = this.file(id);
      return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as RepairEngagement) : null;
    } catch {
      return null;
    }
  }

  save(engagement: RepairEngagement): void {
    const file = this.file(engagement.id);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temporary = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify(engagement, null, 2)}\n`);
    fs.renameSync(temporary, file);
  }

  list(): RepairEngagement[] {
    const root = this.root();
    if (!fs.existsSync(root)) return [];
    return fs
      .readdirSync(root)
      .filter((name) => /^RE-\d{8}-[0-9a-f]{6}\.json$/.test(name))
      .map((name) => JSON.parse(fs.readFileSync(path.join(root, name), "utf8")) as RepairEngagement)
      .sort((left, right) => (left.createdAt < right.createdAt ? 1 : -1));
  }
}

export type EngagementAction =
  | { type: "take" }
  | { type: "start" }
  | { type: "submit_for_review"; note?: string }
  | { type: "changes_needed"; note: string }
  | { type: "deliver"; delivery: { kind: "pull-request" | "download"; url?: string | null; reauditReportId?: string | null } }
  | { type: "cancel"; reason: string };

export type EngagementResult = { ok: true; engagement: RepairEngagement } | { ok: false; status: number; error: string };

const OPEN: readonly EngagementStatus[] = ["requested", "held", "in_progress", "in_review"];

export class RepairEngagementService {
  constructor(
    private readonly store: FileEngagementStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  create(input: { customerId: string; projectId: string; reportId: string; findingIds: string[]; quote: RepairQuote }): RepairEngagement {
    const at = this.now();
    const day = at.toISOString().slice(0, 10).replace(/-/g, "");
    let id = "";
    do id = `RE-${day}-${randomBytes(3).toString("hex")}`;
    while (this.store.get(id));
    const engagement: RepairEngagement = {
      id,
      customerId: input.customerId,
      projectId: input.projectId,
      reportId: input.reportId,
      findingIds: [...input.findingIds].sort(),
      quote: input.quote,
      status: "requested",
      payment: "not_collected",
      assignee: null,
      delivery: null,
      createdAt: at.toISOString(),
      updatedAt: at.toISOString(),
      history: [{ at: at.toISOString(), actor: `customer:${input.customerId}`, from: null, to: "requested", note: `Agreed to ${input.quote.totalCents / 100} ${input.quote.currency.toUpperCase()} (rate table v${input.quote.rateTableVersion})` }],
    };
    this.store.save(engagement);
    return engagement;
  }

  /* staff: in-house engineers and admins; otherwise the customer who asked. */
  act(id: string, action: EngagementAction, actor: { userId: string; staff: boolean }): EngagementResult {
    const engagement = this.store.get(id);
    if (!engagement) return { ok: false, status: 404, error: "engagement_not_found" };
    const isCustomer = !actor.staff && engagement.customerId === actor.userId;
    if (!actor.staff && !isCustomer) return { ok: false, status: 404, error: "engagement_not_found" };

    const fail = (error: string, status = 409): EngagementResult => ({ ok: false, status, error });
    let to = engagement.status;
    let note: string | null = null;
    const next: RepairEngagement = { ...engagement };

    switch (action.type) {
      case "take":
        if (!actor.staff) return fail("only_engineers_take_engagements", 403);
        if (!OPEN.includes(engagement.status)) return fail("engagement_is_closed");
        next.assignee = actor.userId;
        note = `Taken by ${actor.userId}`;
        break;
      case "start":
        if (!actor.staff) return fail("only_engineers_start_engagements", 403);
        if (engagement.status !== "requested" && engagement.status !== "held") return fail("engagement_cannot_start_from_here");
        if (engagement.assignee !== actor.userId) return fail("take_the_engagement_first");
        to = "in_progress";
        break;
      case "submit_for_review":
        if (!actor.staff) return fail("only_engineers_submit_for_review", 403);
        if (engagement.status !== "in_progress") return fail("engagement_is_not_in_progress");
        to = "in_review";
        note = action.note?.trim() || null;
        break;
      case "changes_needed":
        if (!actor.staff) return fail("only_engineers_review", 403);
        if (engagement.status !== "in_review") return fail("engagement_is_not_in_review");
        if (!action.note?.trim()) return fail("say_what_needs_changing", 400);
        to = "in_progress";
        note = action.note.trim();
        break;
      case "deliver": {
        if (!actor.staff) return fail("only_engineers_deliver", 403);
        if (engagement.status !== "in_review") return fail("engagement_is_not_in_review");
        const url = action.delivery.url?.trim() || null;
        if (action.delivery.kind === "pull-request" && !(url && /^https:\/\//.test(url))) return fail("a_pull_request_delivery_needs_its_https_url", 400);
        next.delivery = { kind: action.delivery.kind, url, reauditReportId: action.delivery.reauditReportId ?? null };
        to = "delivered";
        note = action.delivery.kind === "pull-request" ? `Pull request ${url}` : "Delivered as a download";
        break;
      }
      case "cancel": {
        if (!OPEN.includes(engagement.status)) return fail("engagement_is_closed");
        if (isCustomer && engagement.status !== "requested" && engagement.status !== "held") return fail("work_has_started_ask_the_team_to_cancel", 403);
        if (!action.reason?.trim()) return fail("a_reason_is_required", 400);
        to = "cancelled";
        note = action.reason.trim();
        break;
      }
      default:
        return fail("unknown_action", 400);
    }

    const at = this.now().toISOString();
    next.status = to;
    next.updatedAt = at;
    next.history = [...engagement.history, { at, actor: actor.staff ? `staff:${actor.userId}` : `customer:${actor.userId}`, from: engagement.status, to, note }];
    this.store.save(next);
    return { ok: true, engagement: next };
  }

  listFor(actor: { userId: string; staff: boolean }): RepairEngagement[] {
    const all = this.store.list();
    return actor.staff ? all : all.filter((engagement) => engagement.customerId === actor.userId);
  }
}
