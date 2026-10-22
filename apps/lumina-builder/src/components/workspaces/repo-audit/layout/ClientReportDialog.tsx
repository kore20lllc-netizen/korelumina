import { useEffect, useMemo, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  draftExecutiveSummary,
  exportClientReportPdf,
  selectClientFindings,
} from "@/services/repositoryAuditClientReport";
import type { FindingSeverity, RepositoryAuditReport } from "@/services/repositoryAuditService";

import { tonePill, toneText } from "../../executive/shared/ExecutiveSection";
import { SEVERITIES, SEVERITY_LABEL, SEVERITY_TONE } from "../shared/auditPresentation";

/*
 * MS-2026-0012: prepare the audit as a report for a client. The audit's
 * findings and scores are used as they are; the person preparing it picks
 * what to include and writes the summary and recommendations.
 */

const PREPARED_BY_KEY = "korelumina.repoAudit.clientReport.preparedBy";
const LOGO_KEY = "korelumina.repoAudit.clientReport.logo";
const MAX_LOGO_BYTES = 400_000;

function remembered(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function remember(key: string, value: string): void {
  try {
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    /* Remembering is a convenience only. */
  }
}

const field = "w-full rounded-[12px] border border-cyan-300/25 bg-slate-950/70 px-3 py-2 text-sm text-cyan-50 outline-none placeholder:text-white/30 focus:border-cyan-300/60";
const label = "text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70";

export function ClientReportDialog({ report, open, onOpenChange }: { report: RepositoryAuditReport; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [clientName, setClientName] = useState("");
  const [title, setTitle] = useState("Repository health review");
  const [preparedBy, setPreparedBy] = useState(() => remembered(PREPARED_BY_KEY));
  const [logo, setLogo] = useState<string | null>(() => remembered(LOGO_KEY) || null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [severities, setSeverities] = useState<ReadonlySet<FindingSeverity>>(new Set(["critical", "high", "medium"]));
  const [includeArchived, setIncludeArchived] = useState(false);
  const [includeAppendix, setIncludeAppendix] = useState(true);
  const [recommendations, setRecommendations] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryEdited, setSummaryEdited] = useState(false);
  const [status, setStatus] = useState<{ tone: "active" | "healthy" | "error"; text: string } | null>(null);

  const included = useMemo(() => selectClientFindings(report, { severities: [...severities], includeArchived }), [report, severities, includeArchived]);
  const draft = useMemo(() => draftExecutiveSummary(report, included), [report, included]);

  useEffect(() => {
    if (!summaryEdited) setSummary(draft);
  }, [draft, summaryEdited]);

  const chooseLogo = (file: File | undefined) => {
    setLogoError(null);
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setLogoError("Use a PNG or JPEG image.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("Use an image under 400 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : null;
      setLogo(value);
      remember(LOGO_KEY, value ?? "");
    };
    reader.onerror = () => setLogoError("The image could not be read.");
    reader.readAsDataURL(file);
  };

  const generate = () => {
    remember(PREPARED_BY_KEY, preparedBy.trim());
    setStatus({ tone: "active", text: "Preparing the PDF…" });
    exportClientReportPdf(report, {
      clientName: clientName.trim(),
      title: title.trim(),
      preparedBy: preparedBy.trim(),
      logoDataUrl: logo,
      severities: [...severities],
      includeArchived,
      summary,
      recommendations,
      includeAppendix,
    })
      .then((fileName) => setStatus({ tone: "healthy", text: `Saved ${fileName}. Read it through before sending it.` }))
      .catch((error) => setStatus({ tone: "error", text: `The PDF could not be made: ${error instanceof Error ? error.message : String(error)}` }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border border-blue-400/60 bg-slate-950/95 p-0 text-white backdrop-blur-2xl">
        <DialogHeader className="border-b border-white/10 p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">Client report</div>
          <DialogTitle className="text-2xl font-semibold tracking-[-0.025em] text-amber-400">Prepare a report for {report.projectId}</DialogTitle>
          <DialogDescription className="text-sm leading-6 text-sky-300/70">
            Findings and scores come from the audit of {new Date(report.completedAt).toLocaleString()} as they are. You choose what to include and write the words around them.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className={label}>Client</span>
              <input className={field} value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Client or company name" />
            </label>
            <label className="grid gap-1.5">
              <span className={label}>Prepared by</span>
              <input className={field} value={preparedBy} onChange={(event) => setPreparedBy(event.target.value)} placeholder="Your name or company" />
            </label>
            <label className="grid gap-1.5 sm:col-span-2">
              <span className={label}>Report title</span>
              <input className={field} value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <div className="grid gap-1.5 sm:col-span-2">
              <span className={label}>Logo on the cover (optional)</span>
              <div className="flex flex-wrap items-center gap-3">
                {logo ? <img src={logo} alt="Logo for the report cover" className="h-10 max-w-[160px] rounded-[8px] bg-white/5 object-contain p-1" /> : null}
                <input type="file" accept="image/png,image/jpeg" onChange={(event) => chooseLogo(event.target.files?.[0])} className="text-xs text-sky-300/80 file:mr-3 file:rounded-full file:border file:border-cyan-300/30 file:bg-cyan-400/10 file:px-3 file:py-1.5 file:text-[10px] file:font-semibold file:uppercase file:tracking-[0.12em] file:text-cyan-200" />
                {logo ? (
                  <button type="button" onClick={() => { setLogo(null); remember(LOGO_KEY, ""); }} className="text-[11px] text-sky-300/70 hover:text-sky-200">
                    Remove
                  </button>
                ) : null}
              </div>
              {logoError ? <p className={`text-xs ${toneText.error}`}>{logoError}</p> : null}
            </div>
          </div>

          <div className="grid gap-2">
            <span className={label}>Include</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Severities included">
              {SEVERITIES.map((severity) => {
                const on = severities.has(severity);
                return (
                  <button
                    key={severity}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setSeverities((current) => {
                        const next = new Set(current);
                        if (next.has(severity)) next.delete(severity);
                        else next.add(severity);
                        return next;
                      })
                    }
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${on ? tonePill[SEVERITY_TONE[severity]] : "border-white/10 text-white/45"}`}
                  >
                    {SEVERITY_LABEL[severity]} · {report.summary.counts[severity]}
                  </button>
                );
              })}
            </div>
            <label className="flex items-center gap-2 text-xs text-sky-300/80">
              <input type="checkbox" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} />
              Include findings in archived or backup code
            </label>
            <label className="flex items-center gap-2 text-xs text-sky-300/80">
              <input type="checkbox" checked={includeAppendix} onChange={(event) => setIncludeAppendix(event.target.checked)} />
              Add a technical appendix listing every file and line
            </label>
            <p className="text-xs text-amber-200/80">{included.length} finding{included.length === 1 ? "" : "s"} will be in the report.</p>
          </div>

          <label className="grid gap-1.5">
            <span className="flex items-center justify-between gap-3">
              <span className={label}>Executive summary</span>
              {summaryEdited ? (
                <button type="button" onClick={() => setSummaryEdited(false)} className="text-[11px] text-cyan-300/80 hover:text-cyan-200">
                  Write it again from the findings
                </button>
              ) : (
                <span className="text-[11px] text-sky-300/50">Written from the findings; edit freely</span>
              )}
            </span>
            <textarea
              className={`${field} min-h-[140px] leading-6`}
              value={summary}
              onChange={(event) => {
                setSummary(event.target.value);
                setSummaryEdited(true);
              }}
            />
          </label>

          <label className="grid gap-1.5">
            <span className={label}>Your recommendations (optional)</span>
            <textarea
              className={`${field} min-h-[110px] leading-6`}
              value={recommendations}
              onChange={(event) => setRecommendations(event.target.value)}
              placeholder="For example: fix the three high-priority items this sprint, then schedule the dependency clean-up."
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <p className={`text-xs ${status ? toneText[status.tone] : "text-sky-300/60"}`} aria-live="polite">
              {status?.text ?? "The PDF downloads to this computer for you to send."}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => onOpenChange(false)} className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70">
                Close
              </button>
              <button
                type="button"
                onClick={generate}
                disabled={status?.tone === "active"}
                className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:opacity-60 ${tonePill.healthy}`}
              >
                Create PDF
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
