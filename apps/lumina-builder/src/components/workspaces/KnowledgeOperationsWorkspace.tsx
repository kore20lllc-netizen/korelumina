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

        if (
          typeof window !==
          "undefined"
        ) {
          (
            window as typeof window & {
              __KORELUMINA_KNOWLEDGE_SNAPSHOT__?:
                KnowledgeOperationsSnapshot;
            }
          ).__KORELUMINA_KNOWLEDGE_SNAPSHOT__ =
            nextSnapshot;

          document.documentElement
            .setAttribute(
              "data-korelumina-knowledge-snapshot",
              JSON.stringify({
                evidence:
                  nextSnapshot.evidence.total,

                candidate:
                  nextSnapshot.knowledge.candidateItems,

                canonical:
                  nextSnapshot.knowledge.canonicalItems,

                totalKnowledge:
                  nextSnapshot.summary.totalKnowledgeItems,

                promotionRate:
                  nextSnapshot.knowledge.promotionRate,

                health:
                  nextSnapshot.summary.healthScore,
              }),
            );
        }
      } catch (error) {
        /*
         * Preserve the last known-good operational snapshot.
         *
         * A transient Runtime request failure must never erase
         * authoritative Knowledge Operations values and turn
         * the certified metrics into anonymous placeholders.
         */
        console.error(
          "[KnowledgeOperations] Failed to refresh authoritative snapshot:",
          error,
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
