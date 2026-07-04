import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Database,
  RefreshCw,
  Settings2,
} from "lucide-react";

import type {
  KnowledgeOperationsSnapshot,
} from "@korelumina/platform-sdk";

import {
  Button,
} from "../ui/button";

import {
  getKnowledgeOverview,
} from "../../services/knowledgeOperationsService";

import {
  GlassWorkspaceHero,
} from "./shared/GlassWorkspaceHero";

import {
  WorkspaceTabBar,
} from "./shared/WorkspaceTabBar";

import {
  KnowledgeOverviewPanel,
} from "./knowledge/KnowledgeOverviewPanel";

import {
  AcquisitionActivityPanel,
} from "./knowledge/AcquisitionActivityPanel";

interface Props {
  setView(
    view: string,
  ): void;
}

const TABS = [
  {
    id: "overview",
    label: "Overview",
  },
  {
    id: "repositories",
    label: "Repositories",
  },
  {
    id: "acquisition",
    label: "Acquisition",
  },
  {
    id: "graph",
    label: "Knowledge Graph",
  },
  {
    id: "coverage",
    label: "Coverage",
  },
  {
    id: "providers",
    label: "Providers",
  },
  {
    id: "activity",
    label: "Activity",
  },
] as const;

export default function KnowledgeOperationsWorkspace({
  setView,
}: Props) {
  const [
    snapshot,
    setSnapshot,
  ] =
    useState<KnowledgeOperationsSnapshot | null>(
      null,
    );

  const [
    activeTab,
    setActiveTab,
  ] =
    useState("overview");

  async function refresh() {
    try {
      setSnapshot(
        await getKnowledgeOverview(),
      );
    } catch {
      // Runtime unavailable.
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const badge =
    useMemo(
      () => "Phase II",
      [],
    );

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <GlassWorkspaceHero
        eyebrow="Master OS"
        title="Knowledge Operations"
        subtitle="Repository Intelligence • Knowledge Graph • Organizational Memory"
        badge={badge}
        onBack={() =>
          setView("dashboard")
        }
        actions={
          <>
            <Button
              variant="outline"
              onClick={() =>
                void refresh()
              }
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Button variant="outline">
              <Database className="mr-2 h-4 w-4" />
              Providers
            </Button>

            <Button variant="default">
              <Settings2 className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </>
        }
      />

      <WorkspaceTabBar
        tabs={TABS}
        active={activeTab}
        onChange={setActiveTab}
      />

      <KnowledgeOverviewPanel
        snapshot={snapshot}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <AcquisitionActivityPanel
          snapshot={snapshot}
        />
      </div>
    </div>
  );
}
