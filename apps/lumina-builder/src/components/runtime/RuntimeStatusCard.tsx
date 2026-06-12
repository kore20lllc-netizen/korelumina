import { Activity, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RuntimeBootPhase } from "@/hooks/useRuntimeBoot";

interface RuntimeStatusCardProps {
  projectId?: string | null;
  phase: RuntimeBootPhase;
  message: string;
  progress: number;
  error?: string | null;
}

const phaseLabel: Record<RuntimeBootPhase, string> = {
  idle: "Idle",
  discovering: "Detecting project",
  starting: "Starting runtime",
  "waiting-port": "Waiting for preview",
  running: "Preview ready",
  rebuilding: "Refreshing preview",
  error: "Runtime issue",
};

function Step({
  label,
  done,
  active,
}: {
  label: string;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      {done ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-cyan" />
      ) : active ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
      ) : (
        <span className="h-3.5 w-3.5 rounded-full border border-border" />
      )}
      <span className={cn(done || active ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
    </div>
  );
}

export function RuntimeStatusCard({
  projectId,
  phase,
  message,
  progress,
  error,
}: RuntimeStatusCardProps) {
  const failed = phase === "error";
  const running = phase === "running";
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden bg-background border border-border shadow-[0_30px_80px_-20px_rgb(0_0_0/0.7)]">
      <div className="absolute inset-0 bg-aurora opacity-40" />
      <div className="relative h-full w-full grid place-items-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-gold/25 bg-surface-1/75 backdrop-blur-xl p-5 shadow-[0_0_44px_-24px_hsl(var(--gold)/0.9)]">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "h-10 w-10 shrink-0 rounded-xl border grid place-items-center",
                failed
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : running
                    ? "bg-cyan/10 border-cyan/30 text-cyan"
                    : "bg-gold/10 border-gold/30 text-gold",
              )}
            >
              {failed ? (
                <AlertTriangle className="h-5 w-5" />
              ) : running ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Activity className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-[0.22em] text-gold/70">
                Runtime status
              </div>
              <div className="mt-1 truncate font-display text-[18px]">
                {projectId || "No project selected"}
              </div>
              <div className="mt-1 text-[12px] text-muted-foreground">
                {error || message}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{phaseLabel[phase]}</span>
              <span>{safeProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-3">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  failed ? "bg-rose-400" : "bg-button-lumina",
                )}
                style={{ width: `${Math.max(6, safeProgress)}%` }}
              />
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <Step label="Project detected" done={safeProgress >= 15} active={phase === "discovering"} />
            <Step label="Launching development server" done={safeProgress >= 40} active={phase === "starting"} />
            <Step label="Waiting for preview port" done={safeProgress >= 72} active={phase === "waiting-port"} />
            <Step
              label={phase === "rebuilding" ? "Refreshing application" : "Preview ready"}
              done={phase === "running"}
              active={phase === "rebuilding"}
            />
          </div>

          {!failed && !running && (
            <div className="mt-5 rounded-xl border border-border bg-background/40 px-3 py-2 text-[11px] text-muted-foreground">
              First launch can take longer while dependencies install. The preview will open automatically when ready.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
