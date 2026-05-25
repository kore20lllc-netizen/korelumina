import { AuditReport } from "@/services/repoAuditService";
import { Settings2, Check, X } from "lucide-react";
import { FindingFixSteps } from "./FindingFixSteps";
import { envFix } from "./fixSteps";

export function EnvironmentAuditCard({ report }: { report: AuditReport }) {
  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-cyan" />
        <div className="font-display font-semibold text-[15px]">Environment</div>
      </div>
      <ul className="divide-y divide-white/5">
        {report.envVars.map((e) => (
          <li key={e.key} className="px-5 py-3 text-[13px]">
            <div className="flex items-center gap-3">
              {e.present ? <Check className="h-3.5 w-3.5 text-cyan" /> : <X className="h-3.5 w-3.5 text-rose-400" />}
              <span className="font-mono">{e.key}</span>
              <span className="text-muted-foreground text-[12px]">{e.description}</span>
              {e.required && !e.present && (
                <span className="ml-auto px-2 py-0.5 rounded-md border border-rose-400/30 bg-rose-500/10 text-rose-300 text-[10px] uppercase tracking-[0.12em]">Required</span>
              )}
            </div>
            {!e.present && <FindingFixSteps id={`env-${e.key}`} guide={envFix(e)} />}
          </li>
        ))}
      </ul>
    </div>
  );
}