import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown, FileText, Pencil, Terminal, Search, Brain,
  Check, AlertTriangle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { diffLines } from "./diff";

export type StepKind = "read" | "edit" | "run" | "search" | "think";
export type StepStatus = "pending" | "running" | "done" | "error";

export interface BuildStep {
  id: string;
  kind: StepKind;
  title: string;
  status: StepStatus;
  detail?: {
    file?: string;
    diff?: { before: string; after: string };
    command?: string;
    output?: string;
    note?: string;
    query?: string;
  };
  startedAt?: number;
  endedAt?: number;
}

const KIND_ICON: Record<StepKind, React.ComponentType<{ className?: string }>> = {
  read: FileText,
  edit: Pencil,
  run: Terminal,
  search: Search,
  think: Brain,
};

const KIND_TONE: Record<StepKind, string> = {
  read: "text-cyan",
  edit: "text-violet",
  run: "text-amber-400",
  search: "text-cyan",
  think: "text-violet",
};

function StatusDot({ status }: { status: StepStatus }) {
  if (status === "running") return <Loader2 className="h-3 w-3 animate-spin text-cyan" />;
  if (status === "done") return <Check className="h-3 w-3 text-cyan" />;
  if (status === "error") return <AlertTriangle className="h-3 w-3 text-magenta" />;
  return <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />;
}

function fmtDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function StepRow({ step }: { step: BuildStep }) {
  const [open, setOpen] = useState(false);
  // Auto-open while running, collapse on done.
  useEffect(() => {
    if (step.status === "running") setOpen(true);
    else if (step.status === "done") setOpen(false);
    else if (step.status === "error") setOpen(true);
  }, [step.status]);

  const Icon = KIND_ICON[step.kind];
  const tone = KIND_TONE[step.kind];
  const elapsed =
    step.startedAt && step.endedAt ? fmtDuration(step.endedAt - step.startedAt) : null;
  const hasDetail = !!step.detail && (
    !!step.detail.file || !!step.detail.diff || !!step.detail.command ||
    !!step.detail.output || !!step.detail.note || !!step.detail.query
  );

  return (
    <li>
      <button
        onClick={() => hasDetail && setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`step-${step.id}`}
        disabled={!hasDetail}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left",
          hasDetail ? "hover:bg-surface-2/60" : "cursor-default",
          "transition"
        )}
      >
        <span className="grid place-items-center h-4 w-4 shrink-0">
          <StatusDot status={step.status} />
        </span>
        <Icon className={cn("h-3 w-3 shrink-0", tone)} />
        <span className={cn(
          "text-[11px] uppercase tracking-wider font-medium shrink-0",
          step.status === "pending" ? "text-muted-foreground/70" : "text-foreground/85"
        )}>
          {step.kind}
        </span>
        <span className={cn(
          "text-[12px] truncate flex-1",
          step.status === "pending" ? "text-muted-foreground/60" : "text-foreground/90"
        )}>
          {step.title}
        </span>
        {elapsed && (
          <span className="text-[10px] tabular-nums text-muted-foreground/70 shrink-0">{elapsed}</span>
        )}
        {hasDetail && (
          <ChevronDown
            className={cn(
              "h-3 w-3 text-muted-foreground/70 shrink-0 motion-reduce:transition-none transition-transform",
              open && "rotate-180"
            )}
          />
        )}
      </button>

      {open && hasDetail && (
        <div id={`step-${step.id}`} className="mt-1 ml-7 mb-1 rounded-md border border-white/10 bg-background/50 p-2 space-y-1.5">
          {step.detail?.file && (
            <div className="font-mono text-[11px] text-muted-foreground">{step.detail.file}</div>
          )}
          {step.detail?.query && (
            <div className="font-mono text-[11px] text-cyan">{step.detail.query}</div>
          )}
          {step.detail?.note && (
            <div className="text-[12px] text-foreground/80 leading-relaxed">{step.detail.note}</div>
          )}
          {step.detail?.command && (
            <pre className="font-mono text-[11px] text-foreground/90 px-2 py-1 rounded bg-surface-2/60 border border-border overflow-x-auto whitespace-pre">$ {step.detail.command}</pre>
          )}
          {step.detail?.output && (
            <pre className="font-mono text-[11px] leading-5 text-muted-foreground px-2 py-1 rounded bg-background/60 border border-border max-h-48 overflow-auto whitespace-pre">{step.detail.output}</pre>
          )}
          {step.detail?.diff && <InlineDiff before={step.detail.diff.before} after={step.detail.diff.after} />}
        </div>
      )}
    </li>
  );
}

function InlineDiff({ before, after }: { before: string; after: string }) {
  const lines = useMemo(() => diffLines(before, after), [before, after]);
  const adds = lines.filter((l) => l.type === "add").length;
  const dels = lines.filter((l) => l.type === "del").length;
  return (
    <div className="rounded border border-border overflow-hidden">
      <div className="flex items-center justify-between px-2 py-0.5 border-b border-border bg-surface-1/40 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>diff</span>
        <span className="inline-flex items-center gap-2 normal-case tracking-normal">
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-cyan" />+{adds}</span>
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-magenta" />−{dels}</span>
        </span>
      </div>
      <pre className="text-[11px] leading-5 font-mono overflow-x-auto max-h-48 overflow-y-auto">
        {lines.map((l, i) => (
          <div
            key={i}
            className={cn(
              "px-2 whitespace-pre",
              l.type === "add" && "bg-cyan/10 text-cyan",
              l.type === "del" && "bg-magenta/10 text-magenta",
              l.type === "eq" && "text-foreground/65"
            )}
          >
            {l.type === "add" ? "+ " : l.type === "del" ? "- " : "  "}
            {l.value || " "}
          </div>
        ))}
      </pre>
    </div>
  );
}

export interface BuildStepsProps {
  steps: BuildStep[];
  defaultOpen?: boolean;
}

export function BuildSteps({ steps, defaultOpen = false }: BuildStepsProps) {
  const anyRunning = steps.some((s) => s.status === "running" || s.status === "pending");
  const [open, setOpen] = useState(defaultOpen || anyRunning);

  // Auto-open while a step is in flight; do not force-close on completion
  // (user may have opened it manually).
  useEffect(() => {
    if (anyRunning) setOpen(true);
  }, [anyRunning]);

  const done = steps.filter((s) => s.status === "done" || s.status === "error").length;
  const total = steps.length;
  const firstStart = steps.find((s) => s.startedAt)?.startedAt;
  const lastEnd = [...steps].reverse().find((s) => s.endedAt)?.endedAt;
  const elapsed = firstStart && lastEnd && lastEnd > firstStart ? fmtDuration(lastEnd - firstStart) : null;

  return (
    <div className="mt-2 mb-1 rounded-xl border border-white/10 bg-surface-1/60 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="build-steps-body"
        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-surface-2/40 transition"
      >
        {anyRunning ? (
          <Loader2 className="h-3.5 w-3.5 text-cyan animate-spin" />
        ) : (
          <Terminal className="h-3.5 w-3.5 text-cyan" />
        )}
        <span className="text-[12px] font-medium text-foreground/90">Build steps</span>
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded-md border tabular-nums",
          done === total && total > 0
            ? "border-cyan/30 bg-cyan/10 text-cyan"
            : "border-border bg-surface-1 text-muted-foreground"
        )}>
          {done}/{total}
        </span>
        {elapsed && <span className="text-[10px] tabular-nums text-muted-foreground/70">· {elapsed}</span>}
        <span className="flex-1" />
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground/70 motion-reduce:transition-none transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <ul id="build-steps-body" className="px-1.5 pb-1.5 pt-0.5 space-y-0.5 border-t border-white/5">
          {steps.map((s) => <StepRow key={s.id} step={s} />)}
        </ul>
      )}
    </div>
  );
}