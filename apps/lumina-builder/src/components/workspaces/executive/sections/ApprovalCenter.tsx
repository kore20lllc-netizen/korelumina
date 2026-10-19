import { useState } from "react";
import { ShieldCheck } from "lucide-react";

import { LuminaFlagshipCard } from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";
import type { ExecutiveApprovalRecord } from "@/services/executiveOfficeService";

import { ExecutiveSection, tonePill } from "../shared/ExecutiveSection";
import { decideApproval, useExecutiveOffice } from "../state/useExecutiveOffice";

/*
 * EW-1: wired. Executive decisions the Chief Agent proposed are approved or
 * rejected here, by the owner, through Runtime. Canonical knowledge
 * promotions waiting for review are listed with a way into Canonical Review
 * in Knowledge Operations, where their full evidence lives.
 */

function ExecutiveApprovalCard({
  approval,
  rationale,
  evidenceCount,
}: {
  approval: ExecutiveApprovalRecord;
  rationale: string | null;
  evidenceCount: number | null;
}) {
  const office = useExecutiveOffice();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const deciding = office.deciding[approval.id];
  const failure = office.decisionErrors[approval.id];
  const confidence = approval.metadata?.reasoningConfidence;

  return (
    <LuminaFlagshipCard as="article" className="rounded-[20px] p-4">
      <div className="relative z-10 grid gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">Executive decision</div>
          <div className="mt-1 text-base font-semibold text-amber-300">{approval.metadata?.decisionTitle ?? approval.decisionId}</div>
          <div className="mt-0.5 truncate font-mono text-[11px] text-sky-300/50" title={approval.id}>{approval.id}</div>
        </div>
        <dl className="grid gap-2 text-xs">
          {[
            ["Question", approval.metadata?.reasoningQuestion ?? "—"],
            ["Chief Agent's proposal", rationale ?? "—"],
            ["Evidence", evidenceCount === null ? "—" : `${evidenceCount} canonical citation${evidenceCount === 1 ? "" : "s"}`],
            ["Confidence", typeof confidence === "number" ? confidence.toFixed(2) : "—"],
            ["Requested by", `${approval.requestedBy} · ${new Date(approval.createdAt).toLocaleString()}`],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-sky-300/60">{label}</dt>
              <dd className="mt-0.5 line-clamp-4 break-words text-sky-100/80">{value}</dd>
            </div>
          ))}
        </dl>

        {rejecting ? (
          <textarea
            rows={2}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Why are you rejecting this? (required)"
            className="[color-scheme:dark] w-full resize-none rounded-[14px] border border-rose-300/[0.25] bg-slate-950/[0.42] px-3 py-2 text-sm text-sky-100 placeholder:text-slate-500 outline-none focus:border-rose-300/50"
          />
        ) : null}

        {failure ? (
          <div className="rounded-[12px] border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-xs text-rose-100">
            Not recorded: {failure}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {rejecting ? (
            <>
              <button
                type="button"
                disabled={Boolean(deciding) || reason.trim().length === 0}
                onClick={async () => {
                  if (await decideApproval(approval.id, "reject", reason.trim())) setRejecting(false);
                }}
                className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50 ${tonePill.error}`}
              >
                {deciding === "reject" ? "Rejecting…" : "Confirm reject"}
              </button>
              <button
                type="button"
                disabled={Boolean(deciding)}
                onClick={() => setRejecting(false)}
                className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60 disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={Boolean(deciding)}
                onClick={() => void decideApproval(approval.id, "approve")}
                className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50 ${tonePill.healthy}`}
              >
                {deciding === "approve" ? "Approving…" : "Approve"}
              </button>
              <button
                type="button"
                disabled={Boolean(deciding)}
                onClick={() => setRejecting(true)}
                className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50 ${tonePill.error}`}
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </LuminaFlagshipCard>
  );
}

export function ApprovalCenter({
  onOpenCanonicalReview,
}: {
  onOpenCanonicalReview?: () => void;
}) {
  const office = useExecutiveOffice();
  const operations = office.operations.status === "ok" ? office.operations.data : null;
  const reviews = office.canonicalReviews.status === "ok" ? office.canonicalReviews.data : [];

  const decisions = new Map((operations?.decisions ?? []).map((decision) => [decision.id, decision]));
  const pendingApprovals = (operations?.approvals ?? []).filter((approval) => approval.status === "pending");
  const waiting = pendingApprovals.length + reviews.length;

  return (
    <ExecutiveSection
      id="executive-approvals"
      icon={ShieldCheck}
      iconState={waiting > 0 ? "warning" : "healthy"}
      eyebrow="Approval Center"
      title="No high-impact action without you"
      description="Decisions the Chief Agent proposed, and knowledge waiting for canonical review. Nothing it proposes takes effect until you decide."
      wiring="live"
      actions={
        <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${tonePill[waiting > 0 ? "warning" : "healthy"]}`}>
          {waiting} waiting
        </span>
      }
    >
      <div className="grid gap-4">
        {office.operations.status === "loading" ? (
          <div className="text-sm text-sky-300/60">Reading approvals…</div>
        ) : null}
        {office.operations.status === "error" ? (
          <div className="rounded-[14px] border border-rose-300/25 bg-rose-400/10 px-3.5 py-2.5 text-sm text-rose-100">
            Approvals unavailable: {office.operations.message}
          </div>
        ) : null}

        {pendingApprovals.map((approval) => {
          const decision = decisions.get(approval.decisionId);
          return (
            <ExecutiveApprovalCard
              key={approval.id}
              approval={approval}
              rationale={decision?.rationale ?? null}
              evidenceCount={decision?.evidence?.length ?? null}
            />
          );
        })}

        {reviews.map((review) => (
          <LuminaFlagshipCard key={review.id} as="article" className="rounded-[20px] p-4">
            <div className="relative z-10 grid gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">Canonical knowledge promotion · {review.classification.replace(/_/g, " ")}</div>
                <div className="mt-1 text-base font-semibold text-amber-300">{review.title}</div>
                <div className="mt-0.5 truncate font-mono text-[11px] text-sky-300/50" title={review.id}>{review.id}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!onOpenCanonicalReview}
                  onClick={onOpenCanonicalReview}
                  className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50 ${tonePill.active}`}
                >
                  Open Canonical Review
                </button>
              </div>
            </div>
          </LuminaFlagshipCard>
        ))}

        {office.operations.status === "ok" && waiting === 0 ? (
          <div className="rounded-[14px] border border-emerald-300/20 bg-emerald-400/5 px-3.5 py-3 text-sm text-emerald-100/80">
            Nothing is waiting for you.
          </div>
        ) : null}
      </div>
    </ExecutiveSection>
  );
}
