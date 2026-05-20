import { AuditReport } from "@/services/repoAuditService";
import { Bug } from "lucide-react";
import { FindingFixSteps } from "./FindingFixSteps";
import { buildErrorFix } from "./fixSteps";

export function BuildErrorsCard({ report }: { report: AuditReport }) {
  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
        <Bug className="h-4 w-4 text-rose-400" />
        <div className="font-display font-semibold text-[15px]">Build Errors</div>
        <span className="ml-auto text-[11px] text-muted-foreground">{report.buildErrors.length} errors</span>
      </div>
      <ul className="divide-y divide-white/5">
        {report.buildErrors.map((e, i) => (
          <li key={i} className="px-5 py-3 text-[13px]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-foreground">{e.file}</span>
              <span className="text-muted-foreground text-[11px]">:{e.line}</span>
              {e.code && (
                <span className="ml-auto px-1.5 py-0.5 rounded bg-surface-2 text-[10px] font-mono text-muted-foreground">{e.code}</span>
              )}
            </div>
            <div className="text-muted-foreground mt-0.5">{e.message}</div>
            <FindingFixSteps id={`build-${i}`} guide={buildErrorFix(e)} />
          </li>
        ))}
      </ul>
    </div>
  );
}