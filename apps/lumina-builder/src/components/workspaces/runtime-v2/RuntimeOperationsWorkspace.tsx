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
  RuntimeOperationsLayoutV2,
} from "./layout/RuntimeOperationsLayoutV2";

import {
  useIsMobile,
} from "@/hooks/use-mobile";

import {
  useRuntimeOperations,
} from "@/hooks/useRuntimeOperations";

import {
  useRuntimeWorkspaceSelection,
} from "@/hooks/useRuntimeWorkspaceSelectionV2";

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
  useRuntimeOperationsWorkspaceV2,
} from "./hooks/useRuntimeOperationsWorkspaceV2";

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
    status,
    snapshot,
    error,
    reload,
    dispatch,
    setScenario,
    pending,
    scenarioPending,

    filteredProjects,
    selectedProject,

    selectedId,
    setSelectedId,

    query: searchQuery,
    setQuery: setSearchQuery,

    environment,
    setEnvironment,

    health,
    setHealth,

    selectedEvents,
    selectedTimeline,
    selectedLogs,

    searchRef,
    inspectorOpen,
    setInspectorOpen,
    isMobile,
    hasMatches,
  } =
    useRuntimeOperationsWorkspaceV2();

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

  return (
    <RuntimeOperationsLayoutV2
      header={
        <RuntimeExecutiveDeck
          ref={searchRef}
          overall={snapshot.overall}
          projects={snapshot.projects}
          updatedAt={snapshot.updatedAt}
          query={searchQuery}
          onQuery={setSearchQuery}
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
      fleet={
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
      operations={
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
