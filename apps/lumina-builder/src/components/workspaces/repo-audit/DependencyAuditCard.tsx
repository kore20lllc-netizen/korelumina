import { AuditReport } from "@/services/repoAuditService";
import { Package } from "lucide-react";
import { FindingFixSteps } from "./FindingFixSteps";
import { dependencyFix } from "./fixSteps";

const sevColor: Record<string, string> = {
  low: "text-muted-foreground border-border",
  medium: "text-gold border-gold/30 bg-gold/10",
  high: "text-rose-300 border-rose-400/30 bg-rose-500/10",
  critical: "text-rose-200 border-rose-400/50 bg-rose-500/20",
};

export function DependencyAuditCard({ report }: { report: AuditReport }) {
  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
        <Package className="h-4 w-4 text-gold" />
        <div className="font-display font-semibold text-[15px]">Dependencies</div>
        <span className="ml-auto text-[11px] text-muted-foreground">{report.missingDependencies.length} issues</span>
      </div>
      <ul className="divide-y divide-white/5">
        {report.missingDependencies.map((d) => (
          <li key={d.name} className="px-5 py-3 text-[13px]">
            <div className="flex items-center gap-3">
              <div className="font-mono text-foreground">{d.name}</div>
              <div className="text-muted-foreground text-[12px]">required {d.required} · found {d.found ?? "—"}</div>
              <span className={`ml-auto px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-[0.12em] ${sevColor[d.severity]}`}>{d.severity}</span>
            </div>
            <FindingFixSteps id={`dep-${d.name}`} guide={dependencyFix(d)} />
          </li>
        ))}
      </ul>
    </div>
  );
}