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

export interface EvidenceWorkspaceProps {
  snapshot: KnowledgeOperationsSnapshot | null;
}

export function EvidenceWorkspace({
  snapshot,
}: EvidenceWorkspaceProps) {
  return (
    <LuminaWorkspacePanel className="min-h-[640px] p-0">
      <div className="p-5">
        <GlowCard
          className="glass-runtime rounded-[28px]"
          interactive={false}
        >
          <KnowledgeAcquisitionPanel
            acquisition={snapshot?.acquisition}
          />
        </GlowCard>
      </div>
    </LuminaWorkspacePanel>
  );
}

export default EvidenceWorkspace;
