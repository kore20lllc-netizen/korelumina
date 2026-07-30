import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  KnowledgeOperationsSnapshot,
} from "@korelumina/platform-sdk";

import {
  LuminaWorkspaceLayout,
} from "@/components/lumina/workspace";

import {
  getKnowledgeOverview,
} from "@/services/knowledgeOperationsService";

import {
  KnowledgeOperationalMetrics,
  KnowledgeWorkspaceHero,
  KnowledgeWorkspaceInspector,
  KnowledgeWorkspaceRegions,
  KnowledgeWorkspaceToolbar,
} from "./knowledge/layout";

import type {
  KnowledgeWorkspace,
} from "./knowledge/workspaces";

interface Props {
  setView(view: string): void;
}

export type {
  KnowledgeWorkspace,
};

export default function KnowledgeOperationsWorkspace({
  setView,
}: Props) {
  const [snapshot, setSnapshot] =
    useState<KnowledgeOperationsSnapshot | null>(
      null,
    );

  const [
    activeWorkspace,
    setActiveWorkspace,
  ] = useState<KnowledgeWorkspace>(
    "overview",
  );

  const refresh =
    useCallback(async () => {
      try {
        const nextSnapshot =
          await getKnowledgeOverview();

        setSnapshot(
          nextSnapshot,
        );
      } catch {
        setSnapshot(
          null,
        );
      }
    }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <LuminaWorkspaceLayout
      header={
        <KnowledgeWorkspaceHero
          snapshot={snapshot}
          onBack={() => {
            setView(
              "dashboard",
            );
          }}
          onRefresh={refresh}
        />
      }
      metrics={
        <KnowledgeOperationalMetrics
          snapshot={snapshot}
        />
      }
      toolbar={
        <KnowledgeWorkspaceToolbar
          activeWorkspace={activeWorkspace}
          onWorkspaceChange={
            setActiveWorkspace
          }
          onRefresh={refresh}
        />
      }
      content={
        <KnowledgeWorkspaceRegions
          activeWorkspace={activeWorkspace}
          snapshot={snapshot}
        />
      }
      inspector={
        <KnowledgeWorkspaceInspector />
      }
    />
  );
}
