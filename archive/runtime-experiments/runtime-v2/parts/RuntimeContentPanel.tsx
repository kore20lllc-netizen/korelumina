import {
  LuminaWorkspacePanel,
} from "@/components/lumina";

import type {
  LifecycleEvent,
  LogEntry,
  RuntimeEvent,
} from "@/services/runtime/types";

import {
  RuntimeWorkspaceTabs,
} from "./RuntimeWorkspaceTabs";

const PANEL_HEIGHT_CLASS =
  "min-h-[34rem] lg:h-[clamp(34rem,68vh,48rem)]";

export interface RuntimeContentPanelProps {
  events: RuntimeEvent[];
  timeline: LifecycleEvent[];
  logs: LogEntry[];
}

export function RuntimeContentPanel({
  events,
  timeline,
  logs,
}: RuntimeContentPanelProps) {
  return (
    <LuminaWorkspacePanel
      className={`${PANEL_HEIGHT_CLASS} p-0`}
    >
      <RuntimeWorkspaceTabs
        events={events}
        timeline={timeline}
        logs={logs}
      />
    </LuminaWorkspacePanel>
  );
}

export default RuntimeContentPanel;
