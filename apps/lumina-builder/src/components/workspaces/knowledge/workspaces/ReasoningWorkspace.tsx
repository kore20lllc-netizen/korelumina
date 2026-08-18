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
  KnowledgeReasoningPanel,
} from "../reasoning";

export interface ReasoningWorkspaceProps {
  snapshot: KnowledgeOperationsSnapshot | null;
}

export function ReasoningWorkspace({
  snapshot,
}: ReasoningWorkspaceProps) {
  return (
    <LuminaWorkspacePanel className="min-h-[640px] p-0">
      <div className="p-5">
        <GlowCard
          className="glass-runtime rounded-[28px]"
          interactive={false}
        >
          <KnowledgeReasoningPanel
            snapshot={snapshot}
          />
        </GlowCard>
      </div>
    </LuminaWorkspacePanel>
  );
}

export default ReasoningWorkspace;
