import { Sparkles, Wand2, Activity, RefreshCw, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onGenerateFixPlan: () => void;
  onAutoFix: () => void;
  onFixUntilGreen: () => void;
  onReRunAudit: () => void;
  onViewLogs: () => void;
  generating?: boolean;
  autoFixing?: boolean;
  fixingUntilGreen?: boolean;
  reRunning?: boolean;
  disabled?: boolean;
}

export function RepairActionBar({
  onGenerateFixPlan,
  onAutoFix,
  onFixUntilGreen,
  onReRunAudit,
  onViewLogs,
  generating,
  autoFixing,
  fixingUntilGreen,
  reRunning,
  disabled,
}: Props) {
  return (
    <div className="sticky top-2 z-30 glass rounded-2xl border border-gold/20 shadow-[0_0_60px_-30px_hsl(45_90%_60%/0.5)] p-3 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 pl-1 pr-2">
        <Sparkles className="h-4 w-4 text-gold" />
        <span className="font-display font-semibold text-[13px] tracking-tight">Repair workflow</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 ml-auto">
        <ActionButton
          icon={generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          label={generating ? "Generating…" : "Generate Fix Plan"}
          onClick={onGenerateFixPlan}
          disabled={disabled || generating}
          variant="ghost"
        />
        <ActionButton
          icon={autoFixing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
          label={autoFixing ? "Auto Fixing…" : "Auto Fix"}
          onClick={onAutoFix}
          disabled={disabled || autoFixing}
          variant="primary"
        />
        <ActionButton
          icon={fixingUntilGreen ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
          label={fixingUntilGreen ? "Fixing Until Green…" : "Fix Until Green"}
          onClick={onFixUntilGreen}
          disabled={disabled || fixingUntilGreen}
          variant="gradient"
        />
        <ActionButton
          icon={reRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          label={reRunning ? "Re-Running…" : "Re-Run Audit"}
          onClick={onReRunAudit}
          disabled={disabled || reRunning}
          variant="ghost"
        />
        <ActionButton
          icon={<FileText className="h-3.5 w-3.5" />}
          label="View Build Logs"
          onClick={onViewLogs}
          variant="ghost"
        />
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  variant = "ghost",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "ghost" | "primary" | "gradient";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium tracking-tight transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "ghost" &&
          "border border-border bg-surface-1/80 text-foreground hover:bg-surface-2 hover:border-white/15",
        variant === "primary" &&
          "border border-gold/60 bg-gold/10 text-gold hover:bg-gold/20 hover:border-gold/90 shadow-[0_0_18px_-4px_hsl(45_90%_60%/0.55)] hover:shadow-[0_0_28px_-4px_hsl(45_90%_60%/0.8)] transition-all duration-300",
        variant === "gradient" &&
          "border border-transparent bg-gradient-to-r from-violet via-electric to-cyan text-white hover:brightness-110 shadow-[0_0_30px_-12px_hsl(280_80%_60%/0.6)]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}