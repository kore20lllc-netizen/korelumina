import { AuditReport } from "@/services/repoAuditService";
import { ShieldAlert } from "lucide-react";
import { FindingFixSteps } from "./FindingFixSteps";
import { securityFix } from "./fixSteps";

const sevColor: Record<string, string> = {
  low: "text-muted-foreground border-border",
  medium: "text-gold border-gold/30 bg-gold/10",
  high: "text-rose-300 border-rose-400/30 bg-rose-500/10",
  critical: "text-rose-200 border-rose-400/50 bg-rose-500/20",
};

export function SecurityAuditCard({ report }: { report: AuditReport }) {
  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-magenta" />
        <div className="font-display font-semibold text-[15px]">Security</div>
        <span className="ml-auto text-[11px] text-muted-foreground">{report.securityFindings.length} findings</span>
      </div>
      <ul className="divide-y divide-white/5">
        {report.securityFindings.map((f) => (
          <li key={f.id} className="px-5 py-3 text-[13px]">
            <div className="flex items-center gap-2">
              <span className="font-mono">{f.package}</span>
              <span className={`ml-auto px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-[0.12em] ${sevColor[f.severity]}`}>{f.severity}</span>
            </div>
            <div className="text-muted-foreground mt-0.5">{f.title}</div>
            {f.fixedIn && <div className="text-[11px] text-cyan mt-0.5">Fixed in {f.fixedIn}</div>}
            <FindingFixSteps id={`sec-${f.id}`} guide={securityFix(f)} />
          </li>
        ))}
      </ul>
    </div>
  );
}