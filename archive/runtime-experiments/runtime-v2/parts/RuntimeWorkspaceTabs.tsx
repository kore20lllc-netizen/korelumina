import {
  Tabs,
  TabsContent,
} from "@/components/ui/tabs";

import type {
  LifecycleEvent,
  LogEntry,
  RuntimeEvent,
} from "@/services/runtime/types";

import {
  RuntimeCommandCenterHeader,
} from "./command-center/RuntimeCommandCenterHeader";

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
      <RuntimeCommandCenterHeader
        eventCount={events.length}
        logCount={logs.length}
      />

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
