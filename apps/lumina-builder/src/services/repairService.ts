import { RUNTIME_API, getRuntimeCallerHeaders } from "@/services/runtime/client";
import type { FindingCategory, FindingSeverity } from "@/services/repositoryAuditService";

/*
 * MS-2026-0015: paid repair. Runtime prices the chosen findings from the
 * owner's rate table and refuses agreement to any other price; the Builder
 * shows the quote and sends back exactly what the customer agreed to.
 */

export interface QuoteLine {
  findingId: string;
  title: string;
  severity: FindingSeverity;
  category: FindingCategory;
  priceCents: number;
}

export interface RepairQuote {
  rateTableVersion: number;
  currency: string;
  lines: QuoteLine[];
  subtotalCents: number;
  minimumCents: number;
  totalCents: number;
}

export type EngagementStatus = "requested" | "held" | "in_progress" | "in_review" | "delivered" | "cancelled";

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
  delivery: { kind: "pull-request" | "download"; url: string | null; reauditReportId: string | null } | null;
  createdAt: string;
  updatedAt: string;
  history: { at: string; actor: string; from: EngagementStatus | null; to: EngagementStatus; note: string | null }[];
}

export type EngagementAction =
  | { type: "take" }
  | { type: "start" }
  | { type: "submit_for_review"; note?: string }
  | { type: "changes_needed"; note: string }
  | { type: "deliver"; delivery: { kind: "pull-request" | "download"; url?: string | null; reauditReportId?: string | null } }
  | { type: "cancel"; reason: string };

const MESSAGES: Record<string, string> = {
  repair_rates_not_published: "Repair prices are not published yet.",
  choose_at_least_one_finding: "Choose at least one finding to repair.",
  finding_not_in_report: "A chosen finding is not in this report any more. Reload the report.",
  diagnosis_requires_business_or_enterprise: "Repairs are available on Business and Enterprise.",
  diagnosis_is_for_imported_projects: "Repairs are for imported projects.",
  engineers_do_not_buy_repairs: "KoreLumina engineers do not request repairs; they work them.",
  sign_in_required: "Sign in to request a repair.",
  the_price_changed_review_the_new_quote: "The price changed. Review the new quote before agreeing.",
  work_has_started_ask_the_team_to_cancel: "Work has started, so ask the team to cancel it.",
  a_reason_is_required: "Say why.",
  take_the_engagement_first: "Take the engagement first.",
  a_pull_request_delivery_needs_its_https_url: "A pull request delivery needs the pull request's https URL.",
  engagement_is_closed: "This engagement is closed.",
  forbidden: "You do not have access to this project.",
};

export class RepairError extends Error {
  constructor(message: string, readonly code: string, readonly quote: RepairQuote | null = null) {
    super(message);
  }
}

async function call<T>(path: string, method: "GET" | "POST", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${RUNTIME_API}/api/repair${path}`, {
      method,
      cache: "no-store",
      headers: getRuntimeCallerHeaders(body === undefined ? undefined : { "Content-Type": "application/json" }),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new RepairError("Runtime could not be reached.", "runtime_unreachable");
  }
  const data = (await response.json().catch(() => null)) as (T & { ok?: boolean; error?: string; quote?: RepairQuote }) | null;
  if (!response.ok || !data?.ok) {
    const code = data?.error ?? `runtime_${response.status}`;
    throw new RepairError(MESSAGES[code] ?? code, code, data?.quote ?? null);
  }
  return data;
}

export async function getRepairQuote(projectId: string, reportId: string, findingIds: string[]): Promise<RepairQuote> {
  return (await call<{ quote: RepairQuote }>("/quote", "POST", { projectId, reportId, findingIds })).quote;
}

export async function requestRepair(projectId: string, reportId: string, quote: RepairQuote): Promise<RepairEngagement> {
  return (
    await call<{ engagement: RepairEngagement }>("/engagements", "POST", {
      projectId,
      reportId,
      findingIds: quote.lines.map((line) => line.findingId),
      acceptedTotalCents: quote.totalCents,
      rateTableVersion: quote.rateTableVersion,
    })
  ).engagement;
}

export async function listEngagements(): Promise<RepairEngagement[]> {
  return (await call<{ engagements: RepairEngagement[] }>("/engagements", "GET")).engagements;
}

export async function actOnEngagement(id: string, action: EngagementAction): Promise<RepairEngagement> {
  return (await call<{ engagement: RepairEngagement }>(`/engagements/${encodeURIComponent(id)}/actions`, "POST", action)).engagement;
}

export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
}

export const ENGAGEMENT_STATUS_LABEL: Record<EngagementStatus, string> = {
  requested: "Requested",
  held: "Payment held",
  in_progress: "In progress",
  in_review: "In review",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
