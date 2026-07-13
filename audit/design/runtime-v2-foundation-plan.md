# Runtime v2 Foundation Migration

## Existing Runtime Components
5:import { GlowCard } from "@/components/lumina/GlowCard";
12:import { RuntimeHeader } from "./parts/RuntimeHeader";
14:import { RuntimeProjectsList } from "./parts/RuntimeProjectsList";
15:import { RuntimeEventStream } from "./parts/RuntimeEventStream";
16:import { RuntimeLifecycleTimeline } from "./parts/RuntimeLifecycleTimeline";
17:import { RuntimeLogsPanel } from "./parts/RuntimeLogsPanel";
18:import { RuntimeActionsToolbar } from "./parts/RuntimeActionsToolbar";
19:import { RuntimeInspector } from "./parts/RuntimeInspector";
108:            <GlowCard className="p-0 min-h-[360px] overflow-hidden"><FeedSkeleton /></GlowCard>
109:            <GlowCard className="p-0 min-h-[360px]"><InspectorSkeleton /></GlowCard>
122:        <RuntimeHeader
141:            <RuntimeActionsToolbar
155:                  <RuntimeInspector
170:          <GlowCard className="glass-runtime p-4 h-[560px] overflow-hidden flex flex-col">
177:              ? <RuntimeProjectsList
186:          </GlowCard>
189:          <GlowCard className="glass-runtime p-0 h-[560px] overflow-hidden flex flex-col">
203:                <RuntimeEventStream events={projectEvents} />
206:                <RuntimeLifecycleTimeline
211:                <RuntimeLogsPanel
216:          </GlowCard>
219:          <GlowCard className="glass-runtime p-0 h-[560px] overflow-hidden hidden xl:flex flex-col">
221:            <RuntimeInspector
227:          </GlowCard>

## New Lumina Foundation
apps/lumina-builder/src/components/lumina/workspace/LuminaEmptyState.tsx
apps/lumina-builder/src/components/lumina/workspace/LuminaMetricCard.tsx
apps/lumina-builder/src/components/lumina/workspace/LuminaMetricGrid.tsx
apps/lumina-builder/src/components/lumina/workspace/LuminaSkeleton.tsx
apps/lumina-builder/src/components/lumina/workspace/LuminaStatusBadge.tsx
apps/lumina-builder/src/components/lumina/workspace/LuminaWorkspaceHeader.tsx
apps/lumina-builder/src/components/lumina/workspace/LuminaWorkspaceHero.tsx
apps/lumina-builder/src/components/lumina/workspace/LuminaWorkspacePanel.tsx
apps/lumina-builder/src/components/lumina/workspace/LuminaWorkspaceSection.tsx
apps/lumina-builder/src/components/lumina/workspace/LuminaWorkspaceShell.tsx
apps/lumina-builder/src/components/lumina/workspace/LuminaWorkspaceToolbar.tsx
