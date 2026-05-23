import { AuditReport, applyRepairPlan, previewDiff, type DiffPreview, type RepairStep } from "@/services/repoAuditService";
import { Wand2, Sparkles, Clock, Zap, Eye, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { DiffPreviewDialog } from "./DiffPreviewDialog";

export function RepairPlanCard({ report }: { report: AuditReport }) {
  const [applying, setApplying] = useState(false);
  const [appliedSteps, setAppliedSteps] = useState<Set<string>>(new Set());
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeDiff, setActiveDiff] = useState<DiffPreview | null>(null);
  const total = report.repairPlan.reduce((s, r) => s + r.estMinutes, 0);

  const apply = async () => {
    setApplying(true);
    try {
      const r = await applyRepairPlan(report.projectId);
      toast.success(`Applied ${r.applied} repair steps`);
      setAppliedSteps(new Set(report.repairPlan.map((s) => s.id)));
    } finally {
      setApplying(false);
    }
  };

  const openPreview = async (step: RepairStep) => {
    setLoadingStep(step.id);
    setActiveDiff(null);
    setPreviewOpen(true);
    try {
      const d = await previewDiff(step.id, step.title);
      setActiveDiff(d);
    } finally {
      setLoadingStep(null);
    }
  };

  const applyStep = async (step: RepairStep) => {
    setLoadingStep(step.id);
    try {
      await new Promise((r) => setTimeout(r, 500));
      setAppliedSteps((prev) => new Set(prev).add(step.id));
      toast.success(`Applied · ${step.title}`);
    } finally {
      setLoadingStep(null);
    }
  };

  return (
    <aside className="glass rounded-2xl border border-white/10 p-5 sticky top-4">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4 text-gold" />
        <div className="font-display font-semibold text-[15px]">AI Repair Plan</div>
      </div>
      <p className="text-[12px] text-muted-foreground mb-4">
        Generated from {report.missingDependencies.length + report.buildErrors.length + report.securityFindings.length} signals.
      </p>

      <ul className="space-y-3 mb-5">
        {report.repairPlan.map((step, i) => (
          <li key={step.id} className="rounded-xl border border-white/10 bg-surface-1/60 p-3">
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 grid place-items-center rounded-md bg-gradient-to-br from-violet to-electric text-[10px] text-white font-semibold">{i + 1}</span>
              <div className="text-[13px] font-medium">{step.title}</div>
              {step.automated && (
                <span className="ml-auto px-1.5 py-0.5 rounded-md bg-cyan/10 border border-cyan/30 text-cyan text-[9px] uppercase tracking-[0.14em] inline-flex items-center gap-1">
                  <Zap className="h-2.5 w-2.5" /> Auto
                </span>
              )}
            </div>
            <div className="text-[12px] text-muted-foreground mt-1">{step.detail}</div>
            <div className="text-[11px] text-muted-foreground/70 mt-1 inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> ~{step.estMinutes} min
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <button
                onClick={() => openPreview(step)}
                disabled={loadingStep === step.id}
                className="inline-flex items-center gap-1 h-6 px-2 rounded-md border border-border bg-surface-1 text-[10.5px] hover:bg-surface-2 disabled:opacity-50"
              >
                {loadingStep === step.id && !appliedSteps.has(step.id) ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
                Preview Diff
              </button>
              <button
                onClick={() => applyStep(step)}
                disabled={loadingStep === step.id || appliedSteps.has(step.id)}
                className="inline-flex items-center gap-1 h-6 px-2 rounded-md border border-emerald-400/40 bg-emerald-500/10 text-emerald-300 text-[10.5px] hover:bg-emerald-500/15 disabled:opacity-50"
              >
                {appliedSteps.has(step.id) ? <Check className="h-3 w-3" /> : <Wand2 className="h-3 w-3" />}
                {appliedSteps.has(step.id) ? "Applied" : "Apply This Fix"}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between text-[12px] mb-3">
        <span className="text-muted-foreground">Engineering estimate</span>
        <span className="text-gold font-semibold">{total} min</span>
      </div>

      <LuminaButton size="md" className="w-full" onClick={apply} disabled={applying}>
        <Wand2 className="h-3.5 w-3.5" />
        {applying ? "Applying…" : "Apply Fixes"}
      </LuminaButton>

      <DiffPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        diff={activeDiff}
        loading={!activeDiff && loadingStep !== null}
        applying={false}
        onApply={activeDiff ? () => {
          const step = report.repairPlan.find((s) => s.id === activeDiff.stepId);
          if (step) {
            void applyStep(step);
            setPreviewOpen(false);
          }
        } : undefined}
      />
    </aside>
  );
}