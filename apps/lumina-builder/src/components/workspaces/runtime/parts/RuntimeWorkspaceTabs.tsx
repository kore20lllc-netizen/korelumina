import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import type {
  LifecycleEvent,
  LogEntry,
  RuntimeEvent,
} from "@/services/runtime/types";

import {
  RuntimeEventStream,
} from "./RuntimeEventStream";

import {
  RuntimeLifecycleTimeline,
} from "./RuntimeLifecycleTimeline";

import {
  RuntimeLogsPanel,
} from "./RuntimeLogsPanel";

export interface RuntimeWorkspaceTabsProps {
  events: RuntimeEvent[];

  timeline: LifecycleEvent[];

  logs: LogEntry[];
}

export function RuntimeWorkspaceTabs({
  events,
  timeline,
  logs,
}: RuntimeWorkspaceTabsProps) {
  return (
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
          {events.length} events · {logs.length} logs
        </div>
      </div>

      <TabsContent
        value="events"
        className="m-0 min-h-0 flex-1"
      >
        <RuntimeEventStream
          events={events}
        />
      </TabsContent>

      <TabsContent
        value="timeline"
        className="m-0 min-h-0 flex-1"
      >
        <RuntimeLifecycleTimeline
          events={timeline}
        />
      </TabsContent>

      <TabsContent
        value="logs"
        className="m-0 min-h-0 flex-1"
      >
        <RuntimeLogsPanel
          logs={logs}
        />
      </TabsContent>
    </Tabs>
  );
}

export default RuntimeWorkspaceTabs;
