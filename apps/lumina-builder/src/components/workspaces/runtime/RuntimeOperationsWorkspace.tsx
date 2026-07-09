import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  PanelRightOpen,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  LuminaButton,
} from "@/components/lumina/LuminaButton";

import {
  LuminaWorkspacePanel,
  LuminaWorkspaceToolbar,
} from "@/components/lumina/workspace";

import {
  LuminaWorkspaceLayout,
} from "@/components/lumina/workspace/framework";

import {
  useIsMobile,
} from "@/hooks/use-mobile";

import {
  useRuntimeOperations,
} from "@/hooks/useRuntimeOperations";

import {
  cn,
} from "@/lib/utils";

import type {
  Environment,
  HealthStatus,
} from "@/services/runtime/types";

import {
  RuntimeHeader,
} from "./parts/RuntimeHeader";

import {
  RuntimeHealthOverview,
} from "./parts/RuntimeHealthOverview";

import {
  RuntimeProjectsList,
} from "./parts/RuntimeProjectsList";

import {
  RuntimeEventStream,
} from "./parts/RuntimeEventStream";

import {
  RuntimeLifecycleTimeline,
} from "./parts/RuntimeLifecycleTimeline";

import {
  RuntimeLogsPanel,
} from "./parts/RuntimeLogsPanel";

import {
  RuntimeActionsToolbar,
} from "./parts/RuntimeActionsToolbar";

import {
  RuntimeInspector,
} from "./parts/RuntimeInspector";

import {
  RuntimeEmptyState,
} from "./parts/RuntimeEmptyState";

import {
  RuntimeErrorState,
} from "./parts/RuntimeErrorState";

import {
  FeedSkeleton,
  InspectorSkeleton,
  RowSkeleton,
  TileSkeleton,
} from "./parts/RuntimeSkeletons";

export function RuntimeOperationsWorkspace() {
  const {
    snapshot,
    status,
    error,
    dispatch,
    reload,
    pending,
  } = useRuntimeOperations();

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [query, setQuery] =
    useState("");

  const [env, setEnv] =
    useState<Environment | "all">("all");

  const [health, setHealth] =
    useState<HealthStatus | "all">("all");

  const [inspectorOpen, setInspectorOpen] =
    useState(false);

  const isMobile = useIsMobile();

  const searchRef =
    useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (
      !selectedId &&
      snapshot?.projects.length
    ) {
      setSelectedId(
        snapshot.projects[0].id,
      );
    }
  }, [snapshot, selectedId]);

  const filtered = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    const q =
      query.trim().toLowerCase();

    return snapshot.projects.filter((project) => {
      if (
        env !== "all" &&
        project.env !== env
      ) {
        return false;
      }

      if (
        health !== "all" &&
        project.health.status !== health
      ) {
        return false;
      }

      if (!q) {
        return true;
      }

      return (
        project.name.toLowerCase().includes(q) ||
        project.region.toLowerCase().includes(q) ||
        project.version.toLowerCase().includes(q) ||
        project.env.toLowerCase().includes(q)
      );
    });
  }, [snapshot, query, env, health]);

  const selectedProject = useMemo(
    () =>
      snapshot?.projects.find(
        (project) => project.id === selectedId,
      ) ?? null,
    [snapshot, selectedId],
  );

  const projectEvents = useMemo(
    () =>
      (snapshot?.events ?? []).filter(
        (event) =>
          !selectedProject ||
          event.projectId === selectedProject.id ||
          !selectedProject,
      ),
    [snapshot, selectedProject],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target =
        event.target as HTMLElement | null;

      const typing =
        !!target &&
        (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        );

      if (typing) {
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (!selectedProject) {
        return;
      }

      const key =
        event.key.toLowerCase();

      if (key === "r") {
        event.preventDefault();
        dispatch(
          "restart",
          selectedProject.id,
        ).catch(() => {});
      } else if (key === "s") {
        event.preventDefault();
        dispatch(
          "shutdown",
          selectedProject.id,
        ).catch(() => {});
      } else if (key === "enter") {
        setInspectorOpen(true);
      }
    };

    window.addEventListener(
      "keydown",
      onKey,
    );

    return () =>
      window.removeEventListener(
        "keydown",
        onKey,
      );
  }, [selectedProject, dispatch]);

  if (status === "error") {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-10">
          <RuntimeErrorState
            onRetry={reload}
            message={error?.message}
          />
        </div>
      </div>
    );
  }

  if (status === "loading" || !snapshot) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 md:px-10 md:py-14">
          <div className="space-y-3">
            <div className="h-3 w-40 animate-pulse rounded-md bg-surface-2" />
            <div className="h-10 w-72 animate-pulse rounded-md bg-surface-2" />
            <div className="h-3 w-96 animate-pulse rounded-md bg-surface-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <TileSkeleton key={index} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,320px)_1fr_minmax(0,360px)]">
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <RowSkeleton key={index} />
              ))}
            </div>

            <LuminaWorkspacePanel className="min-h-[360px] p-0">
              <FeedSkeleton />
            </LuminaWorkspacePanel>

            <LuminaWorkspacePanel className="min-h-[360px] p-0">
              <InspectorSkeleton />
            </LuminaWorkspacePanel>
          </div>
        </div>
      </div>
    );
  }

  const hasMatches =
    filtered.length > 0;

  return (
    <LuminaWorkspaceLayout
      header={
        <RuntimeHeader
          ref={searchRef}
          overall={snapshot.overall}
          updatedAt={snapshot.updatedAt}
          query={query}
          onQuery={setQuery}
          env={env}
          onEnv={setEnv}
          health={health}
          onHealth={setHealth}
        />
      }
      metrics={
        <RuntimeHealthOverview
          overall={snapshot.overall}
          projects={snapshot.projects}
        />
      }
      toolbar={
        <LuminaWorkspaceToolbar
          leading={
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {selectedProject ? (
                <>
                  Selected ·{" "}
                  <span className="font-medium text-foreground">
                    {selectedProject.name}
                  </span>
                </>
              ) : (
                "Select a service to see actions and details."
              )}
            </div>
          }
          trailing={
            <>
              <RuntimeActionsToolbar
                project={selectedProject}
                pending={pending}
                onDispatch={dispatch}
                compact={isMobile}
              />

              <Sheet
                open={inspectorOpen}
                onOpenChange={setInspectorOpen}
              >
                <SheetTrigger asChild>
                  <LuminaButton
                    variant="ghost"
                    size="sm"
                    className="lg:hidden text-gold hover:text-gold"
                    aria-label="Open inspector"
                  >
                    <PanelRightOpen className="h-3.5 w-3.5" />
                    Inspector
                  </LuminaButton>
                </SheetTrigger>

                <SheetContent
                  side="right"
                  className="glass-strong w-full border-l border-white/10 p-0 sm:max-w-[420px]"
                >
                  <RuntimeInspector
                    project={selectedProject}
                    logs={snapshot.logs}
                    pending={pending}
                    onDispatch={dispatch}
                  />
                </SheetContent>
              </Sheet>
            </>
          }
        />
      }
      sidebar={
        <LuminaWorkspacePanel className="h-[560px] p-4">
          <div className="flex items-center justify-between px-1 pb-3">
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Services
            </div>

            <div className="text-[10.5px] tabular-nums text-muted-foreground">
              {filtered.length}/{snapshot.projects.length}
            </div>
          </div>

          {hasMatches ? (
            <RuntimeProjectsList
              projects={filtered}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onOpenInspector={() =>
                setInspectorOpen(true)
              }
              className="flex-1"
            />
          ) : (
            <RuntimeEmptyState
              variant="search"
              className="flex-1"
            />
          )}
        </LuminaWorkspacePanel>
      }
      content={
        <LuminaWorkspacePanel className="h-[560px] p-0">
          <Tabs
            defaultValue="events"
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.025] px-4 pb-3 pt-4 backdrop-blur-xl">
              <TabsList className="rounded-2xl border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl">
                <TabsTrigger value="events">
                  Events
                </TabsTrigger>

                <TabsTrigger value="timeline">
                  Lifecycle
                </TabsTrigger>

                <TabsTrigger value="logs">
                  Logs
                </TabsTrigger>
              </TabsList>

              <div className="text-[10.5px] tabular-nums text-muted-foreground">
                {snapshot.events.length} events ·{" "}
                {snapshot.logs.length} logs
              </div>
            </div>

            <TabsContent
              value="events"
              className={cn(
                "m-0 min-h-0 flex-1",
              )}
            >
              <RuntimeEventStream
                events={projectEvents}
              />
            </TabsContent>

            <TabsContent
              value="timeline"
              className="m-0 min-h-0 flex-1"
            >
              <RuntimeLifecycleTimeline
                events={snapshot.timeline.filter(
                  (event) =>
                    !selectedProject ||
                    event.projectId === selectedProject.id,
                )}
              />
            </TabsContent>

            <TabsContent
              value="logs"
              className="m-0 min-h-0 flex-1"
            >
              <RuntimeLogsPanel
                logs={snapshot.logs.filter(
                  (log) =>
                    !selectedProject ||
                    log.projectId === selectedProject.id,
                )}
              />
            </TabsContent>
          </Tabs>
        </LuminaWorkspacePanel>
      }
      inspector={
        <LuminaWorkspacePanel className="hidden h-[560px] p-0 xl:flex">
          <RuntimeInspector
            project={selectedProject}
            logs={snapshot.logs}
            pending={pending}
            onDispatch={dispatch}
          />
        </LuminaWorkspacePanel>
      }
    />
  );
}

export default RuntimeOperationsWorkspace;
