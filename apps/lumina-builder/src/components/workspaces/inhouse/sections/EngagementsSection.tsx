import { useState } from "react";
import { ClipboardList } from "lucide-react";

import { LuminaFlagshipCard } from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";
import { useWorkspace } from "@/context/WorkspaceContext";
import { cn } from "@/lib/utils";
import { auth } from "@/providers/auth-registry";
import { ENGAGEMENT_STATUS_LABEL, formatMoney, type RepairEngagement } from "@/services/repairService";

import type { PreviewTone } from "../../executive/design/executiveDesignPreview";
import { ExecutiveSection, tonePill, toneText } from "../../executive/shared/ExecutiveSection";
import { SEVERITY_LABEL, SEVERITY_TONE, relativeTime } from "../../repo-audit/shared/auditPresentation";
import { rememberAuditProject } from "../../repo-audit/state/useRepoAudit";
import type { InHouseConsole } from "../state/useInHouseConsole";

/*
 * MS-2026-0015: the repair queue. Customers' agreed repairs land here;
 * an engineer takes one, works it, submits it for review, and delivers it
 * as a pull request or a download. Every step is recorded by Runtime.
 */

type Filter = "open" | "delivered" | "cancelled" | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
  { id: "all", label: "All" },
];

const STATUS_TONE: Record<RepairEngagement["status"], PreviewTone> = {
  requested: "warning",
  held: "warning",
  in_progress: "active",
  in_review: "active",
  delivered: "healthy",
  cancelled: "error",
};

const OPEN = new Set(["requested", "held", "in_progress", "in_review"]);

function Pill({ tone = "active", onClick, disabled, children }: { tone?: PreviewTone; onClick: () => void; disabled?: boolean; children: string }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50 ${tonePill[tone]}`}>
      {children}
    </button>
  );
}

function Field({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="min-w-0 flex-1 rounded-[12px] border border-cyan-300/25 bg-slate-950/70 px-3 py-1.5 text-xs text-cyan-50 outline-none placeholder:text-white/30 focus:border-cyan-300/60"
    />
  );
}

type Form = { kind: "review" | "changes" | "deliver" | "cancel"; note: string; deliveryKind: "pull-request" | "download"; url: string };

function EngagementRow({ engagement, view }: { engagement: RepairEngagement; view: InHouseConsole }) {
  const { setView } = useWorkspace();
  const me = auth.getUser()?.id ?? null;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const busy = view.acting === engagement.id;
  const mine = engagement.assignee !== null && engagement.assignee === me;
  const error = view.actionError?.id === engagement.id ? view.actionError.message : null;

  const submit = async () => {
    if (!form) return;
    const ok = await view.act(
      engagement.id,
      form.kind === "review"
        ? { type: "submit_for_review", note: form.note }
        : form.kind === "changes"
          ? { type: "changes_needed", note: form.note }
          : form.kind === "cancel"
            ? { type: "cancel", reason: form.note }
            : { type: "deliver", delivery: { kind: form.deliveryKind, url: form.deliveryKind === "pull-request" ? form.url : null } },
    );
    if (ok) setForm(null);
  };
  const begin = (kind: Form["kind"]) => setForm({ kind, note: "", deliveryKind: "pull-request", url: "" });
  const needsNote = form && (form.kind === "changes" || form.kind === "cancel");
  const ready = form && (needsNote ? form.note.trim() !== "" : form.kind === "deliver" ? form.deliveryKind === "download" || /^https:\/\//.test(form.url.trim()) : true);

  return (
    <li>
      <LuminaFlagshipCard as="article" className="rounded-[18px] p-4">
        <div className="relative z-10 grid gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="min-w-0 flex-1 text-left">
              <div className="text-sm font-semibold text-sky-50">
                {engagement.id} · {engagement.projectId} · {formatMoney(engagement.quote.totalCents, engagement.quote.currency)}
              </div>
              <div className="text-xs leading-5 text-sky-300/60">
                {engagement.findingIds.length} finding{engagement.findingIds.length === 1 ? "" : "s"} · customer {engagement.customerId.slice(0, 8)} · asked {relativeTime(Date.parse(engagement.createdAt))}
                {engagement.assignee ? ` · ${mine ? "you" : `engineer ${engagement.assignee.slice(0, 8)}`}` : " · no engineer yet"}
                {engagement.payment === "not_collected" ? " · payment not collected" : ""}
              </div>
            </button>
            <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${tonePill[STATUS_TONE[engagement.status]]}`}>{ENGAGEMENT_STATUS_LABEL[engagement.status]}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Pill
              onClick={() => {
                rememberAuditProject(engagement.projectId);
                setView("repo-audit");
              }}
            >
              Open audit
            </Pill>
            {OPEN.has(engagement.status) && !mine ? <Pill tone="warning" disabled={busy} onClick={() => void view.act(engagement.id, { type: "take" })}>{engagement.assignee ? "Take over" : "Take"}</Pill> : null}
            {(engagement.status === "requested" || engagement.status === "held") && mine ? <Pill tone="healthy" disabled={busy} onClick={() => void view.act(engagement.id, { type: "start" })}>Start</Pill> : null}
            {engagement.status === "in_progress" && mine ? <Pill tone="healthy" disabled={busy} onClick={() => begin("review")}>Submit for review</Pill> : null}
            {engagement.status === "in_review" ? (
              <>
                <Pill tone="warning" disabled={busy} onClick={() => begin("changes")}>Changes needed</Pill>
                <Pill tone="healthy" disabled={busy} onClick={() => begin("deliver")}>Deliver</Pill>
              </>
            ) : null}
            {OPEN.has(engagement.status) ? <Pill tone="error" disabled={busy} onClick={() => begin("cancel")}>Cancel</Pill> : null}
            {engagement.delivery?.url ? (
              <a href={engagement.delivery.url} target="_blank" rel="noreferrer" className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${tonePill.healthy}`}>
                Pull request
              </a>
            ) : null}
          </div>

          {form ? (
            <div className="flex flex-wrap items-center gap-2">
              {form.kind === "deliver" ? (
                <>
                  <select
                    value={form.deliveryKind}
                    onChange={(event) => setForm({ ...form, deliveryKind: event.target.value as Form["deliveryKind"] })}
                    aria-label="Delivered as"
                    className="rounded-[12px] border border-cyan-300/25 bg-slate-950/70 px-2 py-1.5 text-xs text-cyan-50"
                  >
                    <option value="pull-request">Pull request</option>
                    <option value="download">Download</option>
                  </select>
                  {form.deliveryKind === "pull-request" ? <Field value={form.url} onChange={(url) => setForm({ ...form, url })} placeholder="https://… pull request URL" /> : null}
                </>
              ) : (
                <Field
                  value={form.note}
                  onChange={(note) => setForm({ ...form, note })}
                  placeholder={form.kind === "cancel" ? "Why is it cancelled?" : form.kind === "changes" ? "What needs changing?" : "Note for the reviewer (optional)"}
                />
              )}
              <Pill tone={form.kind === "cancel" ? "error" : "healthy"} disabled={busy || !ready} onClick={() => void submit()}>
                {form.kind === "review" ? "Submit" : form.kind === "changes" ? "Send back" : form.kind === "deliver" ? "Deliver" : "Cancel repair"}
              </Pill>
              <button type="button" onClick={() => setForm(null)} className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
                Back
              </button>
            </div>
          ) : null}
          {error ? <p className={`text-xs ${toneText.error}`}>{error}</p> : null}

          {open ? (
            <div className="grid gap-3 border-t border-white/[0.08] pt-3 md:grid-cols-2">
              <div className="grid gap-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">Findings agreed · rate table v{engagement.quote.rateTableVersion}</div>
                <ul className="grid gap-1 text-xs">
                  {engagement.quote.lines.map((line) => (
                    <li key={line.findingId} className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className={`mr-2 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${tonePill[SEVERITY_TONE[line.severity]]}`}>{SEVERITY_LABEL[line.severity]}</span>
                        <span className="text-sky-100/80">{line.title}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-sky-300/70">{formatMoney(line.priceCents, engagement.quote.currency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid content-start gap-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">History</div>
                <ol className="grid gap-1 text-xs text-sky-300/70">
                  {engagement.history.map((event, index) => (
                    <li key={`${event.at}-${index}`}>
                      <span className="text-sky-100/80">{ENGAGEMENT_STATUS_LABEL[event.to]}</span> · {new Date(event.at).toLocaleString()} · {event.actor}
                      {event.note ? ` · ${event.note}` : ""}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : null}
        </div>
      </LuminaFlagshipCard>
    </li>
  );
}

export function EngagementsSection({ view }: { view: InHouseConsole }) {
  const [filter, setFilter] = useState<Filter>("open");
  const all = view.engagements.status === "ok" ? view.engagements.data : [];
  const shown = all.filter((engagement) => filter === "all" || (filter === "open" ? OPEN.has(engagement.status) : engagement.status === filter));
  return (
    <ExecutiveSection id="inhouse-engagements" icon={ClipboardList} iconState={view.openRepairs.some((entry) => !entry.assignee) ? "warning" : "active"} eyebrow="Engagements" title="Customer repairs to work" description="Repairs customers agreed to from their diagnosis. Take one, do the work, submit it for review, and deliver it as a pull request or a download." wiring="live">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show">
        {FILTERS.map((entry) => {
          const count = entry.id === "all" ? all.length : entry.id === "open" ? all.filter((engagement) => OPEN.has(engagement.status)).length : all.filter((engagement) => engagement.status === entry.id).length;
          return (
            <button
              key={entry.id}
              type="button"
              aria-pressed={filter === entry.id}
              onClick={() => setFilter(entry.id)}
              className={cn("rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]", filter === entry.id ? tonePill.active : "border-white/10 text-white/45 hover:text-white/70")}
            >
              {entry.label} · {count}
            </button>
          );
        })}
      </div>
      {view.engagements.status === "loading" ? (
        <p className="text-sm text-sky-300/70">Reading the queue…</p>
      ) : view.engagements.status === "error" ? (
        <p className={`text-sm ${toneText.error}`}>{view.engagements.message}</p>
      ) : shown.length === 0 ? (
        <p className="text-sm text-sky-300/70">{filter === "open" ? "No open repairs." : "Nothing here."}</p>
      ) : (
        <ul className="grid gap-2.5">
          {shown.map((engagement) => (
            <EngagementRow key={engagement.id} engagement={engagement} view={view} />
          ))}
        </ul>
      )}
    </ExecutiveSection>
  );
}
