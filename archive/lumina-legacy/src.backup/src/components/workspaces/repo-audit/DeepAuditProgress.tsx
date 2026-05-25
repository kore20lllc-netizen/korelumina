import { useEffect, useMemo, useState } from "react";
import { Loader2, Check, AlertTriangle, ShieldCheck, X, Radio, WifiOff, CloudOff, PauseCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditProgressEvent, AuditTransportInfo } from "@/services/repoAuditService";

export const DEEP_AUDIT_STEPS = [
  "Inspecting package.json",
  "Detecting framework and runtime",
  "Validating dependencies",
  "Scanning environment variables",
  "Executing production build",
  "Capturing TypeScript errors",
  "Generating repair plan",
  "Preparing audit report",
];

interface Props {
  mode: "scan" | "deep";
  error?: string | null;
  /** Live progress events from the backend stream. When provided, the
   *  component renders real-time step state and rotating status messages
   *  instead of advancing on a fixed timer. */
  events?: AuditProgressEvent[];
  /** When provided, renders a Cancel button in the header that aborts the
   *  in-flight audit stream. */
  onCancel?: () => void;
  /** Current backend transport state — drives the small connection chip. */
  transport?: AuditTransportInfo | null;
  /** When true, the run was cancelled by the user. The partial timeline is
   *  preserved as a draft and the card swaps into a "Cancelled" state. */
  cancelled?: boolean;
  /** Resume the last cancelled run with the same source/mode. */
  onResume?: () => void;
  /** Discard the kept draft and clear the card. */
  onDismissDraft?: () => void;
  /** When set, shows a "Resuming from step N" chip while the run is live. */
  resumingFromIndex?: number | null;
}

export function DeepAuditProgress({
  mode,
  error,
  events,
  onCancel,
  transport,
  cancelled,
  onResume,
  onDismissDraft,
  resumingFromIndex,
}: Props) {
  const [index, setIndex] = useState(0);

  const live = events && events.length > 0;

  // Derive the displayed timeline from events when available, otherwise
  // fall back to the static DEEP_AUDIT_STEPS list driven by the timer below.
  const labels = useMemo(() => {
    if (!live) return DEEP_AUDIT_STEPS;
    const seen = new Map<number, string>();
    let total = events!.length;
    for (const ev of events!) {
      seen.set(ev.index, ev.step);
      if (typeof ev.total === "number") total = Math.max(total, ev.total);
    }
    const out: string[] = [];
    for (let i = 0; i < total; i++) out.push(seen.get(i) ?? "Working…");
    return out;
  }, [events, live]);

  const last = live ? events![events!.length - 1] : null;
  const liveIndex = last ? (last.status === "done" ? last.index + 1 : last.index) : 0;
  const liveMessage = last?.status === "running" ? last.message : undefined;

  useEffect(() => {
    if (error || live) return;
    setIndex(0);
    const id = window.setInterval(() => {
      setIndex((i) => Math.min(i + 1, DEEP_AUDIT_STEPS.length - 1));
    }, mode === "deep" ? 2400 : 900);
    return () => window.clearInterval(id);
  }, [mode, error, live]);

  const activeIndex = live ? liveIndex : index;

  const isDeep = mode === "deep";
  const title = error
    ? "Audit Failed"
    : cancelled
    ? isDeep ? "Deep Audit Cancelled" : "Fast Scan Cancelled"
    : isDeep
    ? "Running Deep Audit"
    : "Running Fast Scan";
  const completedSteps = live ? Math.min(liveIndex, labels.length) : 0;
  const subtitle = error
    ? error
    : cancelled
    ? `Stopped after ${completedSteps} of ${labels.length} steps. Partial draft kept — resume to continue from the picker, or dismiss to clear.`
    : liveMessage
    ? liveMessage
    : isDeep
    ? "KoreLumina is performing a full production-grade analysis of this repository."
    : "Quickly inspecting structure, dependencies, and environment.";

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-2xl glass rounded-2xl border p-6 md:p-8 overflow-hidden",
        error
          ? "border-rose-400/40 shadow-[0_0_60px_-20px_hsl(0_80%_60%/0.45)]"
          : cancelled
          ? "border-amber-400/30 shadow-[0_0_60px_-20px_hsl(40_90%_60%/0.35)]"
          : "border-gold/30 shadow-[0_0_80px_-20px_hsl(45_90%_60%/0.45)]",
        !error && !cancelled && "animate-pulse",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-60 blur-3xl",
          error
            ? "bg-[radial-gradient(circle_at_30%_20%,hsl(0_80%_55%/0.18),transparent_60%)]"
            : cancelled
            ? "bg-[radial-gradient(circle_at_30%_20%,hsl(40_90%_55%/0.15),transparent_60%)]"
            : "bg-[radial-gradient(circle_at_30%_20%,hsl(45_90%_60%/0.18),transparent_60%)]"
        )}
      />
      <div className="relative flex items-start gap-4">
        <div
          className={cn(
            "h-12 w-12 rounded-xl grid place-items-center border",
            error
              ? "bg-rose-500/10 border-rose-400/40 text-rose-300"
              : cancelled
              ? "bg-amber-500/10 border-amber-400/40 text-amber-300"
              : "bg-gold/10 border-gold/40 text-gold"
          )}
        >
          {error ? (
            <AlertTriangle className="h-6 w-6" />
          ) : cancelled ? (
            <PauseCircle className="h-6 w-6" />
          ) : (
            <Loader2 className="h-6 w-6 animate-spin" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {isDeep ? "Deep Audit" : "Fast Scan"}
            </div>
            {transport && !cancelled && <TransportChip info={transport} />}
            {!cancelled && !error && typeof resumingFromIndex === "number" && resumingFromIndex > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-gold">
                <RotateCcw className="h-3 w-3" /> Resuming from step {resumingFromIndex + 1}
                {labels.length ? ` of ${labels.length}` : ""}
              </span>
            )}
            {cancelled && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-amber-200">
                <PauseCircle className="h-3 w-3" /> Draft kept
              </span>
            )}
          </div>
          <div className="font-display text-xl font-semibold tracking-tight">{title}</div>
          <p className="text-[13px] text-muted-foreground mt-1">{subtitle}</p>
          {transport?.transport === "simulated" && !error && !cancelled && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-500/5 px-3 py-2 text-[12px] text-amber-200/90">
              <CloudOff className="h-3.5 w-3.5 mt-[2px] shrink-0" />
              <div className="min-w-0">
                <div className="font-medium text-amber-100">Live stream unavailable</div>
                <div className="text-amber-200/70 truncate">
                  {transport.reason ?? "Showing simulated progress until the backend reconnects."}
                </div>
              </div>
            </div>
          )}
          {cancelled && (onResume || onDismissDraft) && (
            <div className="mt-3 flex items-center gap-2">
              {onResume && (
                <button
                  type="button"
                  onClick={onResume}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gold/60 bg-gold/10 px-3 py-1.5 text-[12px] font-semibold text-gold hover:bg-gold/20 hover:border-gold/90 shadow-[0_0_12px_-2px_hsl(var(--gold)/0.35)] hover:shadow-[0_0_22px_-2px_hsl(var(--gold)/0.65)] transition-all duration-300"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Resume audit
                </button>
              )}
              {onDismissDraft && (
                <button
                  type="button"
                  onClick={onDismissDraft}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-1/80 px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" /> Dismiss draft
                </button>
              )}
            </div>
          )}
        </div>
        {onCancel && !error && !cancelled && (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-1/80 px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:border-rose-400/40 hover:bg-rose-500/10 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
        )}
      </div>

      {!error && (
        <ol className="relative mt-6 space-y-2.5 pl-1">
          {labels.map((label, i) => {
            const done = i < activeIndex;
            const active = i === activeIndex && !cancelled;
            const pending = cancelled && i >= activeIndex;
            return (
              <li key={label} className="flex items-center gap-3 text-[13px]">
                <span
                  className={cn(
                    "h-5 w-5 grid place-items-center rounded-full border",
                    done && "border-emerald-400/50 bg-emerald-500/10 text-emerald-300",
                    active && "border-gold/60 bg-gold/10 text-gold",
                    pending && "border-amber-400/30 bg-amber-500/5 text-amber-300/70",
                    !done && !active && !pending && "border-border bg-surface-1 text-muted-foreground"
                  )}
                >
                  {done ? (
                    <Check className="h-3 w-3" />
                  ) : active ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : pending ? (
                    <PauseCircle className="h-3 w-3" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                  )}
                </span>
                <span className="flex-1 min-w-0 flex items-center gap-2">
                  <span
                    className={cn(
                      active && "text-foreground font-medium",
                      done && "text-muted-foreground line-through decoration-emerald-400/40",
                      pending && "text-amber-200/70 italic",
                      !done && !active && !pending && "text-muted-foreground"
                    )}
                  >
                    {label}
                    {pending && i === activeIndex && " · paused"}
                  </span>
                  {active && liveMessage && (
                    <span className="truncate text-[12px] text-muted-foreground/80">
                      · {liveMessage}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function TransportChip({ info }: { info: AuditTransportInfo }) {
  const { transport, reason } = info;
  const config = {
    connecting: {
      label: "Connecting…",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      className: "border-border bg-surface-1 text-muted-foreground",
    },
    stream: {
      label: "Live stream connected",
      icon: <Radio className="h-3 w-3" />,
      className: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
    },
    simulated: {
      label: "Stream disconnected",
      icon: <WifiOff className="h-3 w-3" />,
      className: "border-amber-400/40 bg-amber-500/10 text-amber-200",
    },
    error: {
      label: "Stream error",
      icon: <AlertTriangle className="h-3 w-3" />,
      className: "border-rose-400/40 bg-rose-500/10 text-rose-300",
    },
  }[transport];
  return (
    <span
      title={reason}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide",
        config.className,
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
