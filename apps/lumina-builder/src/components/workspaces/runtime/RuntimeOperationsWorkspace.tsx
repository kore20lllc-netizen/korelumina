import { useEffect, useMemo, useRef, useState } from "react";
import { PanelRightOpen } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { GlowCard } from "@/components/lumina/GlowCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRuntimeOperations } from "@/hooks/useRuntimeOperations";
import { cn } from "@/lib/utils";
import type { Environment, HealthStatus } from "@/services/runtime/types";

import { RuntimeHeader } from "./parts/RuntimeHeader";
import { RuntimeHealthOverview } from "./parts/RuntimeHealthOverview";
import { RuntimeProjectsList } from "./parts/RuntimeProjectsList";
import { RuntimeEventStream } from "./parts/RuntimeEventStream";
import { RuntimeLifecycleTimeline } from "./parts/RuntimeLifecycleTimeline";
import { RuntimeLogsPanel } from "./parts/RuntimeLogsPanel";
import { RuntimeActionsToolbar } from "./parts/RuntimeActionsToolbar";
import { RuntimeInspector } from "./parts/RuntimeInspector";
import { RuntimeEmptyState } from "./parts/RuntimeEmptyState";
import { RuntimeErrorState } from "./parts/RuntimeErrorState";
import { TileSkeleton, RowSkeleton, FeedSkeleton, InspectorSkeleton } from "./parts/RuntimeSkeletons";

export function RuntimeOperationsWorkspace() {
  const { snapshot, status, error, dispatch, reload, pending } = useRuntimeOperations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [env, setEnv] = useState<Environment | "all">("all");
  const [health, setHealth] = useState<HealthStatus | "all">("all");
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const isMobile = useIsMobile();
  const searchRef = useRef<HTMLInputElement>(null);

  // Auto-select first project when snapshot arrives.
  useEffect(() => {
    if (!selectedId && snapshot?.projects.length) setSelectedId(snapshot.projects[0].id);
  }, [snapshot, selectedId]);

  const filtered = useMemo(() => {
    if (!snapshot) return [];
    const q = query.trim().toLowerCase();
    return snapshot.projects.filter((p) => {
      if (env !== "all" && p.env !== env) return false;
      if (health !== "all" && p.health.status !== health) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q) ||
        p.version.toLowerCase().includes(q) ||
        p.env.toLowerCase().includes(q)
      );
    });
  }, [snapshot, query, env, health]);

  const selectedProject = useMemo(
    () => snapshot?.projects.find((p) => p.id === selectedId) ?? null,
    [snapshot, selectedId],
  );

  const projectEvents = useMemo(
    () => (snapshot?.events ?? []).filter((e) => !selectedProject || e.projectId === selectedProject.id || !selectedProject),
    [snapshot, selectedProject],
  );

  // Keyboard shortcuts, ignoring typing targets.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (typing) return;
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); return; }
      if (!selectedProject) return;
      const key = e.key.toLowerCase();
      if (key === "r") { e.preventDefault(); dispatch("restart", selectedProject.id).catch(() => {}); }
      else if (key === "s") { e.preventDefault(); dispatch("shutdown", selectedProject.id).catch(() => {}); }
      else if (key === "enter") { setInspectorOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedProject, dispatch]);

  // ---------- ERROR ----------
  if (status === "error") {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-10 py-10">
          <RuntimeErrorState onRetry={reload} message={error?.message} />
        </div>
      </div>
    );
  }

  // ---------- LOADING ----------
  if (status === "loading" || !snapshot) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-10 py-10 md:py-14 space-y-6">
          <div className="space-y-3">
            <div className="h-3 w-40 rounded-md bg-surface-2 animate-pulse" />
            <div className="h-10 w-72 rounded-md bg-surface-2 animate-pulse" />
            <div className="h-3 w-96 rounded-md bg-surface-2 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <TileSkeleton key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_1fr_minmax(0,360px)] gap-4">
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}</div>
            <GlowCard className="p-0 min-h-[360px] overflow-hidden"><FeedSkeleton /></GlowCard>
            <GlowCard className="p-0 min-h-[360px]"><InspectorSkeleton /></GlowCard>
          </div>
        </div>
      </div>
    );
  }

  const hasMatches = filtered.length > 0;

  // ---------- READY ----------
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1600px] mx-auto px-4 md:px-10 py-8 md:py-12 space-y-7">
        <RuntimeHeader
          ref={searchRef}
          overall={snapshot.overall}
          updatedAt={snapshot.updatedAt}
          query={query} onQuery={setQuery}
          env={env} onEnv={setEnv}
          health={health} onHealth={setHealth}
        />

        <RuntimeHealthOverview overall={snapshot.overall} projects={snapshot.projects} />

        {/* Actions row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.025] px-4 py-3 backdrop-blur-xl">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {selectedProject
              ? <>Selected · <span className="text-foreground font-medium">{selectedProject.name}</span></>
              : "Select a service to see actions and details."}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <RuntimeActionsToolbar
              project={selectedProject}
              pending={pending}
              onDispatch={dispatch}
              compact={isMobile}
            />
            {(isMobile || true) && (
              <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen}>
                <SheetTrigger asChild>
                  <LuminaButton variant="ghost" size="sm" className="lg:hidden text-gold hover:text-gold" aria-label="Open inspector">
                    <PanelRightOpen className="h-3.5 w-3.5" /> Inspector
                  </LuminaButton>
                </SheetTrigger>
                <SheetContent side="right" className="p-0 w-full sm:max-w-[420px] glass-strong border-l border-white/10">
                  <RuntimeInspector
                    project={selectedProject}
                    logs={snapshot.logs}
                    pending={pending}
                    onDispatch={dispatch}
                  />
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,330px)_1fr] xl:grid-cols-[minmax(0,330px)_1fr_minmax(0,400px)] gap-5 min-h-[560px]">
          {/* Projects rail */}
          <GlowCard className="glass-runtime p-4 h-[560px] overflow-hidden flex flex-col">
            <span className="glass-runtime-noise" aria-hidden />
            <div className="flex items-center justify-between px-1 pb-3">
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Services</div>
              <div className="text-[10.5px] text-muted-foreground tabular-nums">{filtered.length}/{snapshot.projects.length}</div>
            </div>
            {hasMatches
              ? <RuntimeProjectsList
                  projects={filtered}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onOpenInspector={() => setInspectorOpen(true)}
                  className="flex-1"
                />
              : <RuntimeEmptyState variant="search" className="flex-1" />
            }
          </GlowCard>

          {/* Center: events + timeline + logs */}
          <GlowCard className="glass-runtime p-0 h-[560px] overflow-hidden flex flex-col">
            <span className="glass-runtime-noise" aria-hidden />
            <Tabs defaultValue="events" className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/8 bg-white/[0.025] backdrop-blur-xl">
                <TabsList className="rounded-2xl border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl">
                  <TabsTrigger value="events">Events</TabsTrigger>
                  <TabsTrigger value="timeline">Lifecycle</TabsTrigger>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>
                <div className="text-[10.5px] text-muted-foreground tabular-nums">
                  {snapshot.events.length} events · {snapshot.logs.length} logs
                </div>
              </div>
              <TabsContent value="events" className={cn("flex-1 min-h-0 m-0")}>
                <RuntimeEventStream events={projectEvents} />
              </TabsContent>
              <TabsContent value="timeline" className="flex-1 min-h-0 m-0">
                <RuntimeLifecycleTimeline
                  events={snapshot.timeline.filter((t) => !selectedProject || t.projectId === selectedProject.id)}
                />
              </TabsContent>
              <TabsContent value="logs" className="flex-1 min-h-0 m-0">
                <RuntimeLogsPanel
                  logs={snapshot.logs.filter((l) => !selectedProject || l.projectId === selectedProject.id)}
                />
              </TabsContent>
            </Tabs>
          </GlowCard>

          {/* Inspector (desktop) */}
          <GlowCard className="glass-runtime p-0 h-[560px] overflow-hidden hidden xl:flex flex-col">
            <span className="glass-runtime-noise" aria-hidden />
            <RuntimeInspector
              project={selectedProject}
              logs={snapshot.logs}
              pending={pending}
              onDispatch={dispatch}
            />
          </GlowCard>
        </div>
      </div>
    </div>
  );
}

export default RuntimeOperationsWorkspace;