import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
} from "lucide-react";

import type {
  KnowledgeOperationsSnapshot,
} from "@korelumina/platform-sdk";

import {
  Badge,
} from "../ui/badge";

import {
  Button,
} from "../ui/button";

import {
  getKnowledgeOverview,
} from "../../services/knowledgeOperationsService";

import {
  KnowledgeOverviewPanel,
} from "./knowledge/KnowledgeOverviewPanel";

interface Props {
  setView(
    view: string,
  ): void;
}

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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data =
          await getKnowledgeOverview();

        if (!cancelled) {
          setSnapshot(data);
        }
      } catch {
        // Ignore until runtime endpoint is available.
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setView("dashboard")
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div>
            <h1 className="text-2xl font-semibold">
              Knowledge Operations
            </h1>

            <p className="text-muted-foreground">
              Engineering Intelligence Platform
            </p>
          </div>
        </div>

        <Badge>
          Phase II
        </Badge>
      </div>

      <KnowledgeOverviewPanel
        snapshot={snapshot}
      />
    </div>
  );
}
