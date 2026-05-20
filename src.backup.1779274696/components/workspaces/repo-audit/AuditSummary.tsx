import { AuditReport } from "@/services/repoAuditService";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const statusMeta = {
  passing: { icon: CheckCircle2, text: "text-cyan", label: "Passing" },
  warning: { icon: AlertTriangle, text: "text-gold", label: "Warning" },
  failing: { icon: XCircle, text: "text-rose-400", label: "Failing" },
} as const;

export function AuditSummary({ report }: { report: AuditReport }) {
  const Meta = statusMeta[report.buildStatus];
  const Icon = Meta.icon;
  const kpis = [
    { label: "Build Status", value: Meta.label, accent: Meta.text, icon: <Icon className={`h-4 w-4 ${Meta.text}`} /> },
    { label: "Missing Dependencies", value: report.missingDependencies.length, accent: "text-gold" },
    { label: "Type Errors", value: report.typeErrors, accent: "text-rose-400" },
    { label: "Security Findings", value: report.securityFindings.length, accent: "text-magenta" },
    { label: "Est. Fix Time", value: `${report.estimatedFixMinutes}m`, accent: "text-cyan" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {kpis.map((k) => (
        <div key={k.label} className="glass rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
            {k.label}
            {k.icon}
          </div>
          <div className={`mt-2 font-display text-2xl font-semibold ${k.accent}`}>{k.value}</div>
        </div>
      ))}
    </div>
  );
}