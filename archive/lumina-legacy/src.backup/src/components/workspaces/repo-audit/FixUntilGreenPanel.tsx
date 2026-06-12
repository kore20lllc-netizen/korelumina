import { Activity, CheckCircle2, Loader2, AlertTriangle, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FixIteration } from "@/services/repoAuditService";

const PHASE_LABEL: Record<FixIteration["phase"], string> = {
  "deep-audit": "Deep Audit",
  "generate-plan": "Generate Repair Plan",
  "generate-diffs": "Generate Diffs",
  "apply-fixes": "Apply Fixes",
  "rerun-audit": "Re-Run Audit",
  passed: "Build Passing",
  failed: "Stopped",
};

const PHASE_ORDER: FixIteration["phase"][] = [
  "deep-audit",
  "generate-plan",
  "generate-diffs",
  "apply-fixes",
  "rerun-audit",
];

interface Props {
  iterations: FixIteration[];
  current: FixIteration | null;
  onCancel?: () => void;
  done?: boolean;
  passed?: boolean;
}

export function FixUntilGreenPanel({ iterations, current, onCancel, done, passed }: Props) {
  // Group all events by iteration index so we can render a per-iteration
  // summary list with status badges plus a detailed phase breakdown for the
  // active iteration.
  const byIteration = new Map<number, FixIteration[]>();
  for (const ev of iterations) {
    const arr = byIteration.get(ev.index) ?? [];
    arr.push(ev);
    byIteration.set(ev.index, arr);
  }
  const iterationKeys = Array.from(byIteration.keys()).sort((a, b) => a - b);
  const activeIndex = current?.index ?? iterationKeys[iterationKeys.length - 1] ?? 1;
  const remaining = current?.remainingFindings ?? iterations[iterations.length - 1]?.remainingFindings ?? 0;

  // Phase lookup limited to the active iteration drives the detail list.
  const latestByPhase = new Map<FixIteration["phase"], FixIteration>();
  for (const ev of byIteration.get(activeIndex) ?? []) {
    latestByPhase.set(ev.phase, ev);
  }

  const summarizeIteration = (idx: number): { label: string; tone: "running" | "passed" | "failed" | "done"; remaining: number } => {
    const evs = byIteration.get(idx) ?? [];
    const last = evs[evs.length - 1];
    if (evs.some((e) => e.phase === "passed")) return { label: "Passed", tone: "passed", remaining: 0 };
    if (evs.some((e) => e.phase === "failed")) return { label: "Stopped", tone: "failed", remaining: last?.remainingFindings ?? 0 };
    if (idx === activeIndex && !done) return { label: "Running", tone: "running", remaining: last?.remainingFindings ?? 0 };
    return { label: "Complete", tone: "done", remaining: last?.remainingFindings ?? 0 };
  };

  return (
    <div className={cn(
      "glass rounded-2xl border p-5 shadow-[0_0_80px_-30px_hsl(280_80%_60%/0.5)]",
      done && passed && "border-emerald-400/40",
      done && !passed && "border-rose-400/40",
      !done && "border-violet/30",
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-violet" />
          <div className="font-display font-semibold text-[15px]">Fix Until Green</div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Iteration {activeIndex}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            Remaining findings:{" "}
            <span className={cn("font-mono font-semibold", remaining === 0 ? "text-emerald-300" : "text-foreground")}>{remaining}</span>
          </span>
          {onCancel && !done && (
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-border bg-surface-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-rose-400/40"
            >
              <X className="h-3 w-3" /> Cancel
            </button>
          )}
        </div>
      </div>

      {iterationKeys.length > 0 && (
        <ol className="mb-4 flex flex-wrap items-center gap-1.5">
          {iterationKeys.map((idx, i) => {
            const s = summarizeIteration(idx);
            const isActive = idx === activeIndex && !done;
            return (
              <li key={idx} className="inline-flex items-center gap-1.5">
                <IterationBadge index={idx} label={s.label} tone={s.tone} remaining={s.remaining} active={isActive} />
                {i < iterationKeys.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/60" />}
              </li>
            );
          })}
        </ol>
      )}

      <ol className="space-y-2">
        {PHASE_ORDER.map((phase) => {
          const ev = latestByPhase.get(phase);
          const status: FixIteration["status"] = ev?.status ?? "pending";
          return (
            <li key={phase} className="flex items-center gap-3 text-[13px]">
              <PhaseIcon status={status} />
              <span className={cn(
                "flex-1",
                status === "done" && "text-muted-foreground line-through decoration-emerald-400/40",
                status === "running" && "text-foreground font-medium",
                status === "pending" && "text-muted-foreground",
                status === "error" && "text-rose-300",
              )}>
                {PHASE_LABEL[phase]}
              </span>
              <PhaseStatusBadge status={status} />
              {ev?.message && <span className="text-[11px] text-muted-foreground truncate max-w-[40%]">{ev.message}</span>}
            </li>
          );
        })}
      </ol>

      {done && (
        <div className={cn(
          "mt-4 rounded-xl border p-3 text-[13px] inline-flex items-center gap-2 w-full",
          passed ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : "border-rose-400/40 bg-rose-500/10 text-rose-200",
        )}>
          {passed ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {passed ? `Build passing after ${activeIndex} iteration${activeIndex === 1 ? "" : "s"}.` : `Stopped with ${remaining} remaining finding${remaining === 1 ? "" : "s"}.`}
        </div>
      )}
    </div>
  );
}

function PhaseIcon({ status }: { status: FixIteration["status"] }) {
  const cls = "h-5 w-5 grid place-items-center rounded-full border";
  if (status === "done") return <span className={cn(cls, "border-emerald-400/50 bg-emerald-500/10 text-emerald-300")}><CheckCircle2 className="h-3 w-3" /></span>;
  if (status === "running") return <span className={cn(cls, "border-violet/60 bg-violet/10 text-violet")}><Loader2 className="h-3 w-3 animate-spin" /></span>;
  if (status === "error") return <span className={cn(cls, "border-rose-400/50 bg-rose-500/10 text-rose-300")}><AlertTriangle className="h-3 w-3" /></span>;
  return <span className={cn(cls, "border-border bg-surface-1 text-muted-foreground")}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" /></span>;
}

function PhaseStatusBadge({ status }: { status: FixIteration["status"] }) {
  const map = {
    done: { label: "Done", className: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300" },
    running: { label: "Running", className: "border-violet/50 bg-violet/10 text-violet" },
    error: { label: "Error", className: "border-rose-400/40 bg-rose-500/10 text-rose-300" },
    pending: { label: "Pending", className: "border-border bg-surface-1 text-muted-foreground" },
  } as const;
  const c = map[status];
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-[0.14em]",
      c.className,
    )}>
      {c.label}
    </span>
  );
}

function IterationBadge({
  index,
  label,
  tone,
  remaining,
  active,
}: {
  index: number;
  label: string;
  tone: "running" | "passed" | "failed" | "done";
  remaining: number;
  active?: boolean;
}) {
  const toneClass = {
    running: "border-violet/50 bg-violet/10 text-violet",
    passed: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
    failed: "border-rose-400/40 bg-rose-500/10 text-rose-300",
    done: "border-border bg-surface-1 text-muted-foreground",
  }[tone];
  return (
    <span
      title={`Iteration ${index} · ${label} · ${remaining} remaining`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-medium",
        toneClass,
        active && "ring-2 ring-violet/30 ring-offset-1 ring-offset-transparent",
      )}
    >
      <span className="font-mono opacity-80">#{index}</span>
      <span className="uppercase tracking-[0.14em] text-[9.5px]">{label}</span>
      {tone !== "passed" && (
        <span className="font-mono opacity-80">{remaining}↯</span>
      )}
      {tone === "running" && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
    </span>
  );
}