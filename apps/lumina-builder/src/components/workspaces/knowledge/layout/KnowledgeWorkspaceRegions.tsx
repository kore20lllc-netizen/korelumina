import type {
  KnowledgeOperationsSnapshot,
} from "@korelumina/platform-sdk";

import {
  AcquisitionWorkspace,
  CanonicalWorkspace,
  CertificationsWorkspace,
  ConversationsWorkspace,
  EvidenceWorkspace,
  GovernanceWorkspace,
  GraphWorkspace,
  LearningWorkspace,
  OverviewWorkspace,
} from "../workspaces";

import type {
  KnowledgeWorkspace,
} from "../workspaces";

export interface KnowledgeWorkspaceRegionsProps {
  activeWorkspace: KnowledgeWorkspace;
  snapshot: KnowledgeOperationsSnapshot | null;
}

export function KnowledgeWorkspaceRegions({
  activeWorkspace,
  snapshot,
}: KnowledgeWorkspaceRegionsProps) {
  switch (activeWorkspace) {
    case "overview":
      return (
        <OverviewWorkspace
          snapshot={snapshot}
        />
      );

    case "acquisition":
      return (
        <AcquisitionWorkspace
          snapshot={snapshot}
        />
      );

    case "evidence":
      return (
        <EvidenceWorkspace
          snapshot={snapshot}
        />
      );

    case "graph":
      return (
        <GraphWorkspace
          snapshot={snapshot}
        />
      );

    case "canonical":
      return <CanonicalWorkspace />;

    case "learning":
      return <LearningWorkspace />;

    case "conversations":
      return <ConversationsWorkspace />;

    case "certifications":
      return <CertificationsWorkspace />;

    case "governance":
      return <GovernanceWorkspace />;
  }
}

export default KnowledgeWorkspaceRegions;
