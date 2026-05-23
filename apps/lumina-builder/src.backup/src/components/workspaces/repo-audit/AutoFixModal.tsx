import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { Wand2, FileCode, Clock, Loader2, Eye, CheckCircle2 } from "lucide-react";
import type { FixPlan, DiffPreview } from "@/services/repoAuditService";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fixPlan: FixPlan | null;
  loadingPlan?: boolean;
  onGenerateDiffs: () => Promise<DiffPreview[] | null>;
  onPreviewDiff: (diff: DiffPreview) => void;
  onApply: () => Promise<void>;
}

export function AutoFixModal({
  open,
  onOpenChange,
  fixPlan,
  loadingPlan,
  onGenerateDiffs,
  onPreviewDiff,
  onApply,
}: Props) {
  const [diffs, setDiffs] = useState<DiffPreview[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!open) {
      setDiffs(null);
      setGenerating(false);
      setApplying(false);
    }
  }, [open]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await onGenerateDiffs();
      setDiffs(result);
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      await onApply();
      onOpenChange(false);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border border-gold/20 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-gold" /> Auto Fix
          </DialogTitle>
          <DialogDescription>
            KoreLumina will draft a complete repair patch set and let you review before applying.
          </DialogDescription>
        </DialogHeader>

        {loadingPlan && !fixPlan ? (
          <div className="py-10 flex items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Drafting fix plan…
          </div>
        ) : fixPlan ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Findings" value={fixPlan.findingsAddressed.toString()} />
              <Stat label="Files changed" value={fixPlan.filesAffected.length.toString()} />
              <Stat label="Est. time" value={`${fixPlan.estMinutes} min`} icon={<Clock className="h-3 w-3" />} />
            </div>

            <div className="rounded-xl border border-border bg-surface-1/60 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Files expected to change</div>
              <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {fixPlan.filesAffected.map((f) => (
                  <li key={f.path} className="flex items-center gap-2 text-[12px]">
                    <FileCode className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono truncate flex-1">{f.path}</span>
                    <span className={cn(
                      "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md border",
                      f.changeType === "modify" && "border-sky-400/40 bg-sky-500/10 text-sky-300",
                      f.changeType === "add" && "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
                      f.changeType === "delete" && "border-rose-400/40 bg-rose-500/10 text-rose-300",
                    )}>{f.changeType}</span>
                    <span className="text-muted-foreground text-[11px]">~{f.estLines}L</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-[12px] text-muted-foreground">{fixPlan.summary}</p>

            {diffs && diffs.length > 0 && (
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/5 p-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-300 mb-2 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3" /> {diffs.length} diff{diffs.length === 1 ? "" : "s"} generated
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {diffs.map((d) => (
                    <button
                      key={d.stepId}
                      onClick={() => onPreviewDiff(d)}
                      className="inline-flex items-center gap-1 h-6 px-2 rounded-md border border-border bg-surface-1 text-[11px] font-mono hover:bg-surface-2 transition"
                    >
                      <Eye className="h-3 w-3" /> {d.file}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => onOpenChange(false)}
                className="h-9 px-4 rounded-lg text-[12px] text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              {!diffs ? (
                <LuminaButton size="md" onClick={handleGenerate} disabled={generating}>
                  {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                  {generating ? "Generating Diffs…" : "Generate Diffs"}
                </LuminaButton>
              ) : (
                <LuminaButton size="md" onClick={handleApply} disabled={applying}>
                  {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  {applying ? "Applying…" : "Apply Fixes"}
                </LuminaButton>
              )}
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-muted-foreground text-[13px]">No fix plan available yet.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface-1/60 p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-semibold inline-flex items-center gap-1.5">
        {icon}
        {value}
      </div>
    </div>
  );
}