import type {
  KnowledgeOperationsSnapshot,
} from "@korelumina/platform-sdk";

import {
  GlowCard,
} from "@/components/lumina/GlowCard";

import {
  LuminaWorkspacePanel,
} from "@/components/lumina/workspace";

import {
  KnowledgeAcquisitionPanel,
} from "../acquisition";

import {
  KnowledgeActivityFeed,
  KnowledgeHealthOverview,
} from "../overview";

import {
  KnowledgeReasoningPanel,
} from "../reasoning";

export interface OverviewWorkspaceProps {
  snapshot: KnowledgeOperationsSnapshot | null;
}

export function OverviewWorkspace({
  snapshot,
}: OverviewWorkspaceProps) {
  return (
    <LuminaWorkspacePanel className="min-h-0 p-0">
      <div className="flex flex-col gap-6 p-5">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
          <GlowCard
            className="glass-runtime rounded-[28px]"
            interactive={false}
          >
            <KnowledgeAcquisitionPanel
              acquisition={snapshot?.acquisition}
            />
          </GlowCard>

          <GlowCard
            className="glass-runtime rounded-[28px]"
            interactive={false}
          >
            <KnowledgeReasoningPanel
              snapshot={snapshot}
            />
          </GlowCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
          <KnowledgeActivityFeed
            snapshot={snapshot}
          />

          <KnowledgeHealthOverview
            snapshot={snapshot}
          />
        </div>
      </div>
    </LuminaWorkspacePanel>
  );
}

export default OverviewWorkspace;
