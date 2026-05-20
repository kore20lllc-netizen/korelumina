import { CheckCircle2, Download, Rocket, PenTool } from "lucide-react";
import { LuminaButton } from "@/components/lumina/LuminaButton";

interface Props {
  onExportPdf: () => void;
  onOpenBuilder: () => void;
  onDeploy: () => void;
}

export function BuildPassedBanner({ onExportPdf, onOpenBuilder, onDeploy }: Props) {
  return (
    <div className="relative overflow-hidden glass rounded-2xl border border-emerald-400/40 p-6 shadow-[0_0_80px_-30px_hsl(150_70%_50%/0.55)]">
      <div className="pointer-events-none absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_20%_20%,hsl(150_80%_55%/0.18),transparent_60%)]" />
      <div className="relative flex flex-col md:flex-row md:items-center gap-4">
        <div className="h-12 w-12 rounded-xl grid place-items-center border border-emerald-400/40 bg-emerald-500/10 text-emerald-300 shrink-0">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-emerald-300 mb-1">Production build · passing</div>
          <div className="font-display text-xl font-semibold tracking-tight">Build Passed Successfully</div>
          <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">
            KoreLumina has repaired the repository and confirmed a successful production build.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onExportPdf}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-surface-1 text-[12px] hover:bg-surface-2"
          >
            <Download className="h-3.5 w-3.5" /> Export PDF
          </button>
          <button
            onClick={onOpenBuilder}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-surface-1 text-[12px] hover:bg-surface-2"
          >
            <PenTool className="h-3.5 w-3.5" /> Open Builder
          </button>
          <LuminaButton size="md" onClick={onDeploy}>
            <Rocket className="h-3.5 w-3.5" /> Deploy to Vercel
          </LuminaButton>
        </div>
      </div>
    </div>
  );
}