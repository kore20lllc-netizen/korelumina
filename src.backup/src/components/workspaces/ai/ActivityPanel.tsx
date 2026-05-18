import { cn } from "@/lib/utils";
import { activityLog, suggestions } from "./data";

type ActivityPanelProps = {
  generating: boolean;
};

export function ActivityPanel({ generating }: ActivityPanelProps) {
  return (
    <aside className="w-full md:w-[280px] lg:w-[320px] min-h-0 shrink-0 glass-panel p-5 flex flex-col anim-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">Activity</div>
          <div className="font-display font-semibold text-[14px] mt-0.5">AI generation</div>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-violet">
          <span className="h-1.5 w-1.5 rounded-full bg-violet animate-pulse" />
          {generating ? "Running" : "Idle"}
        </span>
      </div>
      <ol className="space-y-3">
        {activityLog.map((step, i) => (
          <li key={i} className="flex gap-3 items-start">
            <div
              className={cn(
                "mt-1 h-2.5 w-2.5 rounded-full shrink-0",
                step.state === "done" && "bg-cyan",
                step.state === "active" && "bg-violet animate-pulse",
                step.state === "pending" && "bg-surface-3 border border-border",
              )}
            />
            <div className="min-w-0 flex-1">
              <div className={cn("text-[13px] leading-snug", step.state === "pending" && "text-muted-foreground")}>
                {step.text}
              </div>
              <div className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono">{step.t}</div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 pt-5 border-t border-border">
        <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-2">Suggestions</div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              className="px-2.5 h-7 rounded-full text-[11px] bg-surface-1 border border-border hover:border-white/15 hover:text-foreground text-muted-foreground transition"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}