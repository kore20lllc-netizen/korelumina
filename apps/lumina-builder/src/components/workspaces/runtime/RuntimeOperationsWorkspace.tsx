import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  LuminaWorkspacePanel,
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

import {
  useRuntimeWorkspaceSelection,
} from "@/hooks/useRuntimeWorkspaceSelection";

import type {
  Environment,
  HealthStatus,
} from "@/services/runtime/types";

import {
  RuntimeCommandBar,
} from "./parts/RuntimeCommandBar";

import {
  RuntimeContentPanel,
} from "./parts/RuntimeContentPanel";

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
  RuntimeExecutiveDeck,
} from "./parts/RuntimeExecutiveDeck";

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
  RuntimeWorkspaceTabs,
} from "./parts/RuntimeWorkspaceTabs";

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


  const {
    selectedId,
    setSelectedId,
    query,
    setQuery,
    environment,
    setEnvironment,
    health,
    setHealth,
    filteredProjects,
    selectedProject,
    selectedEvents,
    selectedTimeline,
    selectedLogs,
  } =
    useRuntimeWorkspaceSelection(
      snapshot,
    );

  const searchRef =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    inspectorOpen,
    setInspectorOpen,
  ] = useState(false);

  const isMobile =
    useIsMobile();

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
        <RuntimeExecutiveDeck
          ref={searchRef}
          overall={snapshot.overall}
          projects={snapshot.projects}
          updatedAt={snapshot.updatedAt}
          query={query}
          onQuery={setQuery}
          env={environment}
          onEnv={setEnvironment}
          health={health}
          onHealth={setHealth}
        />
      }
      toolbar={
        <RuntimeCommandBar
          project={selectedProject}
          logs={snapshot.logs}
          pending={pending}
          compact={isMobile}
          inspectorOpen={inspectorOpen}
          onInspectorOpenChange={
            setInspectorOpen
          }
          onDispatch={dispatch}
          onScenario={setScenario}
          scenarioPending={
            scenarioPending
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
        <RuntimeContentPanel
          events={selectedEvents}
          timeline={selectedTimeline}
          logs={selectedLogs}
        />
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
