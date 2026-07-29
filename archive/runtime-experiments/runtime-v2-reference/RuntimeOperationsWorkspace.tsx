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
  LuminaWorkspacePanel,
  LuminaWorkspaceToolbar,
} from "@/components/lumina";

import {
  LuminaWorkspaceLayout,
} from "@/components/lumina/workspace/framework";

import {
  useIsMobile,
} from "@/hooks/use-mobile";

import {
  useRuntimeOperations,
} from "@/hooks/useRuntimeOperations";

import type {
  Environment,
  HealthStatus,
} from "@/services/runtime/types";

import {
  RuntimeActionsToolbar,
} from "./parts/RuntimeActionsToolbar";

import {
  RuntimeEmptyState,
} from "./parts/RuntimeEmptyState";

import {
  RuntimeErrorState,
} from "./parts/RuntimeErrorState";

import {
  RuntimeEventStream,
} from "./parts/RuntimeEventStream";

import {
  RuntimeHeader,
} from "./parts/RuntimeHeader";

import {
  RuntimeHealthOverview,
} from "./parts/RuntimeHealthOverview";

import {
  RuntimeInspector,
} from "./parts/RuntimeInspector";

import {
  RuntimeLifecycleTimeline,
} from "./parts/RuntimeLifecycleTimeline";

import {
  RuntimeLogsPanel,
} from "./parts/RuntimeLogsPanel";

import {
  RuntimeProjectsList,
} from "./parts/RuntimeProjectsList";

import {
  FeedSkeleton,
  InspectorSkeleton,
  RowSkeleton,
  TileSkeleton,
} from "./parts/RuntimeSkeletons";

const PANEL_HEIGHT_CLASS =
  "min-h-[34rem] lg:h-[clamp(34rem,68vh,48rem)]";

export function RuntimeOperationsWorkspace() {
  const {
    snapshot,
    status,
    error,
    dispatch,
    reload,
    pending,
    setScenario,
    scenarioPending,
  } = useRuntimeOperations();

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [query, setQuery] =
    useState("");

  const [environment, setEnvironment] =
    useState<Environment | "all">("all");

  const [health, setHealth] =
    useState<HealthStatus | "all">("all");

  const [inspectorOpen, setInspectorOpen] =
    useState(false);

  const isMobile =
    useIsMobile();

  const searchRef =
    useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (
      selectedId ||
      !snapshot?.projects.length
    ) {
      return;
    }

    setSelectedId(
      snapshot.projects[0].id,
    );
  }, [
    selectedId,
    snapshot,
  ]);

  const filteredProjects = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    const normalizedQuery =
      query.trim().toLowerCase();

    return snapshot.projects.filter(
      (project) => {
        if (
          environment !== "all" &&
          project.env !== environment
        ) {
          return false;
        }

        if (
          health !== "all" &&
          project.health.status !== health
        ) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return [
          project.name,
          project.region,
          project.version,
          project.env,
        ].some((value) =>
          value
            .toLowerCase()
            .includes(normalizedQuery),
        );
      },
    );
  }, [
    environment,
    health,
    query,
    snapshot,
  ]);

  const selectedProject = useMemo(
    () =>
      snapshot?.projects.find(
        (project) =>
          project.id === selectedId,
      ) ?? null,
    [
      selectedId,
      snapshot,
    ],
  );

  const selectedEvents = useMemo(
    () =>
      (snapshot?.events ?? []).filter(
        (event) =>
          !selectedProject ||
          event.projectId ===
            selectedProject.id,
      ),
    [
      selectedProject,
      snapshot,
    ],
  );

  const selectedTimeline = useMemo(
    () =>
      (snapshot?.timeline ?? []).filter(
        (event) =>
          !selectedProject ||
          event.projectId ===
            selectedProject.id,
      ),
    [
      selectedProject,
      snapshot,
    ],
  );

  const selectedLogs = useMemo(
    () =>
      (snapshot?.logs ?? []).filter(
        (log) =>
          !selectedProject ||
          log.projectId ===
            selectedProject.id,
      ),
    [
      selectedProject,
      snapshot,
    ],
  );

  useEffect(() => {
    const handleKeyboardShortcut = (
      event: KeyboardEvent,
    ) => {
      const target =
        event.target as HTMLElement | null;

      const isTyping =
        Boolean(target) &&
        (
          target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          target?.isContentEditable
        );

      if (isTyping) {
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

        void dispatch(
          "restart",
          selectedProject.id,
        );

        return;
      }

      if (key === "s") {
        event.preventDefault();

        void dispatch(
          "shutdown",
          selectedProject.id,
        );

        return;
      }

      if (key === "enter") {
        event.preventDefault();
        setInspectorOpen(true);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyboardShortcut,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboardShortcut,
      );
    };
  }, [
    dispatch,
    selectedProject,
  ]);

  if (status === "error") {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-10 md:py-14">
          <RuntimeErrorState
            message={error?.message}
            onRetry={reload}
          />
        </div>
      </div>
    );
  }

  if (
    status === "loading" ||
    !snapshot
  ) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-7 px-4 py-8 md:px-10 md:py-12">
          <div className="space-y-3">
            <div className="h-3 w-40 animate-pulse rounded-md [background:var(--lumina-surface-compact)]" />

            <div className="h-10 w-72 max-w-full animate-pulse rounded-md [background:var(--lumina-surface-card)]" />

            <div className="h-3 w-96 max-w-full animate-pulse rounded-md [background:var(--lumina-surface-compact)]" />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from(
              { length: 4 },
              (_, index) => (
                <TileSkeleton
                  key={index}
                />
              ),
            )}
          </div>

          <div className="grid min-h-[34rem] grid-cols-1 gap-5 lg:grid-cols-[minmax(0,330px)_1fr] xl:grid-cols-[minmax(0,330px)_1fr_minmax(0,400px)]">
            <div className="space-y-2">
              {Array.from(
                { length: 5 },
                (_, index) => (
                  <RowSkeleton
                    key={index}
                  />
                ),
              )}
            </div>

            <LuminaWorkspacePanel className="min-h-[34rem] p-0">
              <FeedSkeleton />
            </LuminaWorkspacePanel>

            <LuminaWorkspacePanel className="hidden min-h-[34rem] p-0 xl:flex">
              <InspectorSkeleton />
            </LuminaWorkspacePanel>
          </div>
        </div>
      </div>
    );
  }

  const hasMatches =
    filteredProjects.length > 0;

  return (
    <LuminaWorkspaceLayout
      header={
        <RuntimeHeader
          ref={searchRef}
          overall={snapshot.overall}
          updatedAt={snapshot.updatedAt}
          query={query}
          onQuery={setQuery}
          env={environment}
          onEnv={setEnvironment}
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
                    className="text-gold hover:text-gold xl:hidden"
                    aria-label="Open runtime inspector"
                  >
                    <PanelRightOpen className="h-3.5 w-3.5" />
                    Inspector
                  </LuminaButton>
                </SheetTrigger>

                <SheetContent
                  side="right"
                  className={[
                    "w-full p-0 sm:max-w-[420px]",
                    "border-l",
                    "[border-color:var(--lumina-border-standard)]",
                    "[background:var(--lumina-surface-panel)]",
                    "[backdrop-filter:var(--lumina-blur-surface)]",
                    "[box-shadow:var(--lumina-shadow-panel)]",
                  ].join(" ")}
                >
                  <RuntimeInspector
                    project={selectedProject}
                    logs={snapshot.logs}
                    pending={pending}
                    onDispatch={dispatch}
                  onScenario={(
                    scenario,
                    projectId,
                  ) =>
                    setScenario(
                      scenario,
                      projectId,
                    )
                  }
                  scenarioPending={
                    scenarioPending
                  }
                  />
                </SheetContent>
              </Sheet>
            </>
          }
        />
      }
      sidebar={
        <LuminaWorkspacePanel
          title="Services"
          toolbar={
            <div className="text-[10.5px] tabular-nums text-muted-foreground">
              {filteredProjects.length}/
              {snapshot.projects.length}
            </div>
          }
          className={`${PANEL_HEIGHT_CLASS} p-0`}
        >
          {hasMatches ? (
            <RuntimeProjectsList
              projects={filteredProjects}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onOpenInspector={() =>
                setInspectorOpen(true)
              }
              className="flex-1 p-4"
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
        <LuminaWorkspacePanel
          className={`${PANEL_HEIGHT_CLASS} p-0`}
        >
          <Tabs
            defaultValue="events"
            className="flex min-h-0 flex-1 flex-col"
          >
            <div
              className={[
                "flex flex-col gap-3 border-b px-4 py-4",
                "sm:flex-row sm:items-center sm:justify-between",
                "[border-color:var(--lumina-border-standard)]",
                "[background:var(--lumina-surface-compact)]",
                "[backdrop-filter:var(--lumina-blur-surface)]",
              ].join(" ")}
            >
              <TabsList
                className={[
                  "self-start rounded-2xl border p-1",
                  "[border-color:var(--lumina-border-standard)]",
                  "[background:var(--lumina-surface-interactive)]",
                  "[backdrop-filter:var(--lumina-blur-surface)]",
                  "[box-shadow:var(--lumina-shadow-panel)]",
                ].join(" ")}
              >
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
                {selectedEvents.length} events ·{" "}
                {selectedLogs.length} logs
              </div>
            </div>

            <TabsContent
              value="events"
              className="m-0 min-h-0 flex-1"
            >
              <RuntimeEventStream
                events={selectedEvents}
              />
            </TabsContent>

            <TabsContent
              value="timeline"
              className="m-0 min-h-0 flex-1"
            >
              <RuntimeLifecycleTimeline
                events={selectedTimeline}
              />
            </TabsContent>

            <TabsContent
              value="logs"
              className="m-0 min-h-0 flex-1"
            >
              <RuntimeLogsPanel
                logs={selectedLogs}
              />
            </TabsContent>
          </Tabs>
        </LuminaWorkspacePanel>
      }
      inspector={
        <LuminaWorkspacePanel
          className={`hidden ${PANEL_HEIGHT_CLASS} p-0 xl:flex`}
        >
          <RuntimeInspector
            project={selectedProject}
            logs={snapshot.logs}
            pending={pending}
            onDispatch={dispatch}
          onScenario={(
                    scenario,
                    projectId,
                  ) =>
                    setScenario(
                      scenario,
                      projectId,
                    )
                  }
                  scenarioPending={
                    scenarioPending
                  }
                  />
        </LuminaWorkspacePanel>
      }
    />
  );
}

export default RuntimeOperationsWorkspace;
