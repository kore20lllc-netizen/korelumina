import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Activity, BarChart3, X, Filter, Sparkles, Globe, Crown,
  CheckCircle2, ListChecks, Wand2, Rocket, MousePointerClick,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAnalyticsBuffer, subscribeAnalytics, type AnalyticsEntry, type AnalyticsEvent,
} from "@/lib/analytics";
import { useWorkspace } from "@/context/WorkspaceContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EVENT_META: Partial<Record<AnalyticsEvent, { label: string; Icon: typeof Activity; tint: string }>> = {
  "transform.opened":              { label: "Opened wizard",        Icon: Sparkles,           tint: "text-violet" },
  "transform.closed":              { label: "Closed wizard",        Icon: X,                  tint: "text-muted-foreground" },
  "transform.mode_selected":       { label: "Mode selected",        Icon: ListChecks,         tint: "text-cyan" },
  "transform.analysis_started":    { label: "Analysis started",     Icon: Wand2,              tint: "text-cyan" },
  "transform.plan_viewed":         { label: "Plan viewed",          Icon: BarChart3,          tint: "text-violet" },
  "transform.diff_viewed":         { label: "Diff viewed",          Icon: ListChecks,         tint: "text-violet" },
  "transform.diff_file_toggled":   { label: "Diff file toggled",    Icon: CheckCircle2,       tint: "text-muted-foreground" },
  "transform.diff_file_expanded":  { label: "Diff file expanded",   Icon: ListChecks,         tint: "text-muted-foreground" },
  "transform.applied":             { label: "Approved & applying",  Icon: Rocket,             tint: "text-magenta" },
  "transform.completed":           { label: "Completed",            Icon: CheckCircle2,       tint: "text-cyan" },
  "transform.opened_in_designer":  { label: "Opened in Designer",   Icon: Globe,              tint: "text-gold" },
  "transform.upgrade_gate_shown":  { label: "Upgrade gate shown",   Icon: Crown,              tint: "text-gold" },
  "transform.upgrade_clicked":     { label: "Upgrade clicked",      Icon: MousePointerClick,  tint: "text-gold" },
};

const ALL_MODE = "__all__";
const ALL_PROJECT = "__all__";

function isTransformEvent(e: AnalyticsEvent) {
  return e.startsWith("transform.");
}

function fmtTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function TransformAnalyticsPanel({ open, onOpenChange }: Props) {
  const { projects } = useWorkspace();
  const [entries, setEntries] = useState<AnalyticsEntry[]>([]);
  const [modeFilter, setModeFilter] = useState<string>(ALL_MODE);
  const [projectFilter, setProjectFilter] = useState<string>(ALL_PROJECT);

  // Seed + live-subscribe (only while open to avoid extra work)
  useEffect(() => {
    if (!open) return;
    setEntries(getAnalyticsBuffer().filter((e) => isTransformEvent(e.event)));
    const unsub = subscribeAnalytics((entry) => {
      if (!isTransformEvent(entry.event)) return;
      setEntries((prev) => [...prev, entry].slice(-200));
    });
    return () => { unsub(); };
  }, [open]);

  const filtered = useMemo(() => {
    return entries
      .filter((e) => modeFilter === ALL_MODE || e.props.mode === modeFilter)
      .filter((e) => projectFilter === ALL_PROJECT || e.props.project_id === projectFilter)
      .slice()
      .reverse(); // newest first
  }, [entries, modeFilter, projectFilter]);

  // Funnel counts (respect filters)
  const funnel = useMemo(() => {
    const c = (event: AnalyticsEvent) => filtered.filter((e) => e.event === event).length;
    return {
      opened:     c("transform.opened"),
      planView:   c("transform.plan_viewed"),
      diffView:   c("transform.diff_viewed"),
      completed:  c("transform.completed"),
      upgrade:    c("transform.upgrade_clicked"),
    };
  }, [filtered]);

  // Mode / project options from observed buffer (so they're never stale)
  const modes = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => { if (typeof e.props.mode === "string") set.add(e.props.mode); });
    return Array.from(set);
  }, [entries]);

  const projectOptions = useMemo(() => {
    const ids = new Set<string>();
    entries.forEach((e) => { if (typeof e.props.project_id === "string") ids.add(e.props.project_id as string); });
    return Array.from(ids).map((id) => ({
      id,
      name: projects.find((p) => p.id === id)?.name
        ?? (entries.find((e) => e.props.project_id === id)?.props.project_name as string | undefined)
        ?? id,
    }));
  }, [entries, projects]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 glass-strong border-l border-border flex flex-col">
        <SheetHeader className="p-5 border-b border-border bg-[radial-gradient(circle_at_0%_0%,hsl(var(--royal-blue)/0.25),transparent_55%),radial-gradient(circle_at_100%_0%,hsl(var(--gold)/0.2),transparent_50%)]">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.22em] bg-gold/10 border border-gold/30 text-gold">
              <Activity className="h-3 w-3" /> Internal
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.22em] bg-royal-blue/10 border border-royal-blue/30 text-[hsl(var(--royal-blue))]">
              Transform funnel
            </span>
          </div>
          <SheetTitle className="font-display text-lg tracking-tight">Funnel events</SheetTitle>
          <p className="text-[12px] text-muted-foreground mt-1">
            Live stream of Transform App → Website events. Buffer of the last 200.
          </p>
        </SheetHeader>

        {/* Funnel KPIs */}
        <div className="grid grid-cols-5 gap-1.5 px-5 pt-4">
          <Kpi label="Open"    value={funnel.opened}    accent="violet" />
          <Kpi label="Plan"    value={funnel.planView}  accent="cyan" />
          <Kpi label="Diff"    value={funnel.diffView}  accent="cyan" />
          <Kpi label="Done"    value={funnel.completed} accent="gold" />
          <Kpi label="Upgr."   value={funnel.upgrade}   accent="magenta" />
        </div>

        {/* Filters */}
        <div className="px-5 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            <Filter className="h-3 w-3" /> Filters
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="h-8 px-2 rounded-lg bg-surface-1 border border-border text-xs outline-none focus:border-violet/50"
            >
              <option value={ALL_MODE}>All modes</option>
              {modes.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="h-8 px-2 rounded-lg bg-surface-1 border border-border text-xs outline-none focus:border-violet/50"
            >
              <option value={ALL_PROJECT}>All projects</option>
              {projectOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground tabular-nums">
            {filtered.length} event{filtered.length === 1 ? "" : "s"}
            {(modeFilter !== ALL_MODE || projectFilter !== ALL_PROJECT) && " (filtered)"}
          </div>
        </div>

        {/* Event stream */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {filtered.length === 0 ? (
            <div className="h-full grid place-items-center text-center px-6">
              <div>
                <div className="mx-auto h-10 w-10 grid place-items-center rounded-xl bg-surface-1 border border-border">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-3 text-[12px] text-muted-foreground max-w-xs">
                  No events yet. Open Transform App → Website to populate the funnel.
                </p>
              </div>
            </div>
          ) : (
            <ol className="space-y-1.5">
              {filtered.map((entry, i) => {
                const meta = EVENT_META[entry.event] ?? { label: entry.event, Icon: Activity, tint: "text-muted-foreground" };
                const Icon = meta.Icon;
                const mode = typeof entry.props.mode === "string" ? entry.props.mode : null;
                const projName = (typeof entry.props.project_name === "string" ? entry.props.project_name : null)
                  ?? (typeof entry.props.project_id === "string"
                      ? (projects.find((p) => p.id === entry.props.project_id)?.name ?? null)
                      : null);
                return (
                  <li
                    key={`${entry.ts}-${i}`}
                    className="rounded-lg border border-border bg-surface-1/60 hover:bg-surface-1 transition px-2.5 py-2 flex items-start gap-2.5"
                  >
                    <span className={cn("h-7 w-7 grid place-items-center rounded-md bg-surface-2 border border-border shrink-0", meta.tint)}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium text-foreground truncate">{meta.label}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground tabular-nums shrink-0">{fmtTime(entry.ts)}</span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        {mode && <Chip>{mode}</Chip>}
                        {projName && <Chip tone="royal">{projName}</Chip>}
                        {typeof entry.props.source === "string" && <Chip tone="muted">{entry.props.source}</Chip>}
                        {typeof entry.props.file === "string" && <Chip tone="muted">{shortFile(entry.props.file)}</Chip>}
                        {typeof entry.props.page_count === "number" && <Chip tone="gold">{entry.props.page_count} pages</Chip>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function shortFile(f: string) {
  if (f === "*") return "all files";
  const parts = f.split("/");
  return parts.slice(-1)[0] || f;
}

function Kpi({ label, value, accent }: { label: string; value: number; accent: "violet" | "cyan" | "gold" | "magenta" }) {
  const ring =
    accent === "gold"    ? "border-gold/40 text-gold" :
    accent === "magenta" ? "border-magenta/40 text-magenta" :
    accent === "cyan"    ? "border-cyan/40 text-cyan" :
                           "border-violet/40 text-violet";
  return (
    <div className={cn("rounded-lg border bg-surface-1/60 px-1.5 py-2 text-center", ring)}>
      <div className="font-display text-base tabular-nums">{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function Chip({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "muted" | "royal" | "gold" }) {
  const cls =
    tone === "muted" ? "bg-surface-2 text-muted-foreground border-border" :
    tone === "royal" ? "bg-royal-blue/10 text-[hsl(var(--royal-blue))] border-royal-blue/30" :
    tone === "gold"  ? "bg-gold/10 text-gold border-gold/30" :
                       "bg-violet/10 text-violet border-violet/30";
  return (
    <span className={cn("inline-flex items-center px-1.5 h-4 rounded text-[10px] uppercase tracking-widest border", cls)}>
      {children}
    </span>
  );
}
