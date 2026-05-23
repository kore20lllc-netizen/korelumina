import { cn } from "@/lib/utils";
import { Filter, RotateCcw, Undo2, Trash2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type Severity = "critical" | "high" | "medium" | "low";
export type Category = "deps" | "build" | "env" | "security";

export interface FindingsFilterState {
  severities: Set<Severity>;
  categories: Set<Category>;
}

export const ALL_SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];
export const ALL_CATEGORIES: { id: Category; label: string }[] = [
  { id: "deps", label: "Dependencies" },
  { id: "build", label: "Build Errors" },
  { id: "env", label: "Environment" },
  { id: "security", label: "Security" },
];

const sevStyle: Record<Severity, string> = {
  critical: "border-rose-400/50 bg-rose-500/15 text-rose-200",
  high: "border-rose-400/30 bg-rose-500/10 text-rose-300",
  medium: "border-gold/30 bg-gold/10 text-gold",
  low: "border-border bg-surface-1 text-muted-foreground",
};

interface Props {
  state: FindingsFilterState;
  counts: { total: number; filtered: number };
  onToggleSeverity: (s: Severity) => void;
  onToggleCategory: (c: Category) => void;
  onClear: () => void;
  canUndo?: boolean;
  undoCount?: number;
  onUndo?: () => void;
  onClearHistory?: () => void;
}

export function FindingsFilters({
  state, counts, onToggleSeverity, onToggleCategory, onClear,
  canUndo = false, undoCount = 0, onUndo, onClearHistory,
}: Props) {
  const allSev = state.severities.size === ALL_SEVERITIES.length;
  const allCat = state.categories.size === ALL_CATEGORIES.length;
  const dirty = !allSev || !allCat;
  const [clearOpen, setClearOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const confirmed = confirmText.trim() === "CLEAR";

  return (
    <div className="glass rounded-2xl border border-white/10 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-[12px] text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span className="uppercase tracking-[0.18em] text-[10px]">Filters</span>
          <span className="text-foreground/80">
            {counts.filtered} of {counts.total} findings
          </span>
        </div>
        <div className="flex items-center gap-1.5">
        <button
          onClick={onUndo}
          disabled={!canUndo || !onUndo}
          className={cn(
            "inline-flex items-center gap-1 h-7 px-2.5 rounded-md border text-[11px] transition",
            canUndo
              ? "border-border bg-surface-1 text-foreground hover:bg-surface-2 hover:border-white/15"
              : "border-border/60 bg-surface-1/40 text-muted-foreground/50 cursor-not-allowed"
          )}
          title={canUndo ? `Undo last filter change (${undoCount} step${undoCount === 1 ? "" : "s"} available)` : "Nothing to undo"}
        >
          <Undo2 className="h-3 w-3" /> Undo
          {canUndo && undoCount > 0 && (
            <span className="ml-0.5 text-[10px] px-1 py-0.5 rounded bg-surface-2 text-muted-foreground">{undoCount}</span>
          )}
        </button>
        <AlertDialog
          open={clearOpen}
          onOpenChange={(o) => {
            setClearOpen(o);
            if (!o) setConfirmText("");
          }}
        >
          <AlertDialogTrigger asChild>
            <button
              disabled={!canUndo || !onClearHistory}
              className={cn(
                "inline-flex items-center gap-1 h-7 px-2.5 rounded-md border text-[11px] transition",
                canUndo
                  ? "border-border bg-surface-1 text-foreground hover:bg-surface-2 hover:border-white/15"
                  : "border-border/60 bg-surface-1/40 text-muted-foreground/50 cursor-not-allowed"
              )}
              title={canUndo ? "Discard saved undo history" : "No undo history to clear"}
            >
              <Trash2 className="h-3 w-3" /> Clear history
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear undo history?</AlertDialogTitle>
              <AlertDialogDescription>
                This will discard {undoCount} saved undo step{undoCount === 1 ? "" : "s"} for your Repo audit filters,
                including the persisted history that survives page refreshes. Your current filter selections will not change.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <label htmlFor="clear-history-confirm" className="text-[12px] text-muted-foreground">
                Type <span className="font-mono text-foreground">CLEAR</span> to confirm.
              </label>
              <Input
                id="clear-history-confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="CLEAR"
                autoComplete="off"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && confirmed) {
                    e.preventDefault();
                    onClearHistory?.();
                    setClearOpen(false);
                  }
                }}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep history</AlertDialogCancel>
              <AlertDialogAction
                disabled={!confirmed}
                onClick={(e) => {
                  if (!confirmed) {
                    e.preventDefault();
                    return;
                  }
                  onClearHistory?.();
                }}
                className="bg-rose-500/90 text-white hover:bg-rose-500 disabled:opacity-50 disabled:pointer-events-none"
              >
                Clear history
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <button
          onClick={onClear}
          disabled={!dirty}
          className={cn(
            "inline-flex items-center gap-1 h-7 px-2.5 rounded-md border text-[11px] transition",
            dirty
              ? "border-border bg-surface-1 text-foreground hover:bg-surface-2 hover:border-white/15"
              : "border-border/60 bg-surface-1/40 text-muted-foreground/50 cursor-not-allowed"
          )}
          title={dirty ? "Restore default filters and clear saved selection" : "Filters are already at defaults"}
        >
          <RotateCcw className="h-3 w-3" /> Reset filters
        </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70 mr-1">Severity</span>
          {ALL_SEVERITIES.map((s) => {
            const active = state.severities.has(s);
            return (
              <button
                key={s}
                aria-pressed={active}
                onClick={() => onToggleSeverity(s)}
                className={cn(
                  "h-7 px-2.5 rounded-md border text-[11px] uppercase tracking-[0.12em] transition",
                  active ? sevStyle[s] : "border-border text-muted-foreground/70 hover:text-foreground hover:border-white/15"
                )}
              >
                {s}
              </button>
            );
          })}
        </div>

        <div className="hidden md:block h-5 w-px bg-border" />

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70 mr-1">Category</span>
          {ALL_CATEGORIES.map((c) => {
            const active = state.categories.has(c.id);
            return (
              <button
                key={c.id}
                aria-pressed={active}
                onClick={() => onToggleCategory(c.id)}
                className={cn(
                  "h-7 px-2.5 rounded-md border text-[11px] transition",
                  active
                    ? "border-violet/40 bg-violet/15 text-foreground"
                    : "border-border text-muted-foreground/70 hover:text-foreground hover:border-white/15"
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}