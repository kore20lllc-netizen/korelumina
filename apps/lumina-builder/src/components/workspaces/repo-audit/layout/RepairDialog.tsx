import { useEffect, useMemo, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RepairError, formatMoney, getRepairQuote, requestRepair, type RepairEngagement, type RepairQuote } from "@/services/repairService";
import type { RepositoryAuditReport } from "@/services/repositoryAuditService";

import { tonePill, toneText } from "../../executive/shared/ExecutiveSection";
import { CATEGORY_LABEL, SEVERITIES, SEVERITY_LABEL, SEVERITY_TONE } from "../shared/auditPresentation";

/*
 * MS-2026-0015: the repair pop-up. The customer picks findings, sees the
 * price Runtime computes from the owner's rate table and what will be
 * delivered, and agrees. Nothing is requested or charged until they press
 * Agree; agreeing sends back exactly the quote they saw.
 */

export function RepairDialog({
  report,
  projectId,
  open,
  onOpenChange,
  onRequested,
}: {
  report: RepositoryAuditReport;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequested: (engagement: RepairEngagement) => void;
}) {
  const findings = useMemo(
    () => [...report.findings].filter((finding) => finding.severity !== "info").sort((left, right) => SEVERITIES.indexOf(left.severity) - SEVERITIES.indexOf(right.severity)),
    [report],
  );
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [quote, setQuote] = useState<RepairQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [agreeing, setAgreeing] = useState(false);

  /* Critical and high findings are chosen to begin with. */
  useEffect(() => {
    if (!open) return;
    setChosen(new Set(findings.filter((finding) => finding.severity === "critical" || finding.severity === "high").map((finding) => finding.id)));
    setProblem(null);
  }, [open, findings]);

  useEffect(() => {
    if (!open || chosen.size === 0) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    setQuoting(true);
    const timer = window.setTimeout(() => {
      getRepairQuote(projectId, report.reportId, [...chosen])
        .then((next) => !cancelled && (setQuote(next), setProblem(null)))
        .catch((error) => !cancelled && (setQuote(null), setProblem(error instanceof Error ? error.message : String(error))))
        .finally(() => !cancelled && setQuoting(false));
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, chosen, projectId, report.reportId]);

  const toggle = (id: string) =>
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const agree = () => {
    if (!quote) return;
    setAgreeing(true);
    setProblem(null);
    requestRepair(projectId, report.reportId, quote)
      .then((engagement) => {
        onRequested(engagement);
        onOpenChange(false);
      })
      .catch((error) => {
        if (error instanceof RepairError && error.quote) setQuote(error.quote);
        setProblem(error instanceof Error ? error.message : String(error));
      })
      .finally(() => setAgreeing(false));
  };

  const minimumApplies = quote ? quote.totalCents > quote.subtotalCents : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border border-blue-400/60 bg-slate-950/95 p-0 text-white backdrop-blur-2xl">
        <DialogHeader className="border-b border-white/[0.08] p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/80">Repair</div>
          <DialogTitle className="mt-1 text-2xl font-semibold tracking-[-0.025em] text-amber-400">Ask KoreLumina engineers to repair it</DialogTitle>
          <DialogDescription className="mt-1.5 text-sm leading-6 text-sky-300/70">
            Choose the findings to repair. The price comes from KoreLumina&apos;s published rates; nothing is requested until you agree.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 p-6">
          <section className="grid gap-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">Findings · {chosen.size} chosen</div>
            <ul className="grid max-h-72 gap-1.5 overflow-y-auto pr-1">
              {findings.map((finding) => (
                <li key={finding.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-[12px] border border-cyan-300/15 bg-slate-950/50 px-3 py-2 hover:border-cyan-300/30">
                    <input type="checkbox" className="mt-1" checked={chosen.has(finding.id)} onChange={() => toggle(finding.id)} />
                    <span className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${tonePill[SEVERITY_TONE[finding.severity]]}`}>{SEVERITY_LABEL[finding.severity]}</span>
                    <span className="min-w-0">
                      <span className="block text-sm text-sky-50">{finding.title}</span>
                      <span className="block text-[11px] text-sky-300/60">{CATEGORY_LABEL[finding.category]}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-2 rounded-[16px] border border-cyan-300/15 bg-slate-950/50 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">Price</div>
            {chosen.size === 0 ? (
              <p className="text-sm text-sky-300/70">Choose at least one finding.</p>
            ) : quoting && !quote ? (
              <p className="text-sm text-sky-300/70">Pricing…</p>
            ) : quote ? (
              <>
                <ul className="grid gap-1 text-xs">
                  {SEVERITIES.map((severity) => {
                    const lines = quote.lines.filter((line) => line.severity === severity);
                    if (lines.length === 0) return null;
                    const sum = lines.reduce((total, line) => total + line.priceCents, 0);
                    return (
                      <li key={severity} className="flex justify-between gap-3 text-sky-100/80">
                        <span>
                          {lines.length} {SEVERITY_LABEL[severity].toLowerCase()} finding{lines.length === 1 ? "" : "s"}
                        </span>
                        <span className="tabular-nums">{formatMoney(sum, quote.currency)}</span>
                      </li>
                    );
                  })}
                </ul>
                {minimumApplies ? (
                  <p className="text-xs text-sky-300/70">The minimum for a repair is {formatMoney(quote.minimumCents, quote.currency)}.</p>
                ) : null}
                <div className="flex items-baseline justify-between border-t border-white/[0.08] pt-2">
                  <span className="text-sm font-semibold text-sky-50">Total</span>
                  <span className="text-2xl font-semibold tabular-nums text-amber-300">{formatMoney(quote.totalCents, quote.currency)}</span>
                </div>
                <p className="text-[11px] text-sky-300/50">Rate table version {quote.rateTableVersion}.</p>
              </>
            ) : null}
          </section>

          <section className="grid gap-1.5 text-xs leading-5 text-sky-100/75">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">What happens</div>
            <p>A KoreLumina engineer plans the fixes, makes them, and runs the deep audit to verify them.</p>
            <p>You get a pull request to your repository when KoreLumina has write access to it, otherwise a download of the repaired project, with a fresh audit attached.</p>
            <p>You can cancel until work starts. No payment is taken now; the team confirms payment with you before work begins.</p>
          </section>

          {problem ? <p className={`text-sm ${toneText.error}`} aria-live="polite">{problem}</p> : null}

          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => onOpenChange(false)} className="rounded-full border border-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60 hover:text-white/85">
              Not now
            </button>
            <button
              type="button"
              disabled={!quote || quoting || agreeing}
              onClick={agree}
              className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50 ${tonePill.healthy}`}
            >
              {agreeing ? "Requesting…" : quote ? `Agree · ${formatMoney(quote.totalCents, quote.currency)}` : "Agree"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
