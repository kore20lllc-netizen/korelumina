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
  KnowledgeGraphPanel,
} from "../graph";

export interface GraphWorkspaceProps {
  snapshot: KnowledgeOperationsSnapshot | null;
}

export function GraphWorkspace({
  snapshot,
}: GraphWorkspaceProps) {
  return (
    <LuminaWorkspacePanel
      className="flex min-h-[820px] p-0"
    >
      <div className="flex min-h-0 flex-1 p-5">
        <GlowCard
          className="glass-runtime flex min-h-0 flex-1 overflow-hidden rounded-[32px]"
          interactive={false}
        >
          <KnowledgeGraphPanel
            snapshot={snapshot}
          />
        </GlowCard>
      </div>
    </LuminaWorkspacePanel>
  );
}

export default GraphWorkspace;
