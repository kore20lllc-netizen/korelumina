import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Database,
  Brain,
  Activity,
  FolderGit2,
} from "lucide-react";

import {
  Button,
} from "../ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";

import {
  Badge,
} from "../ui/badge";

import {
  runtimeApi,
} from "../../services/runtimeApi";

import type {
  KnowledgeOperationsSnapshot,
} from "@korelumina/platform-sdk";

interface Props {
  setView(
    view: string,
  ): void;
}

export default function KnowledgeOperationsWorkspace(
  {
    setView,
  }: Props,
) {
  const [
    snapshot,
    setSnapshot,
  ] =
    useState<
      KnowledgeOperationsSnapshot | null
    >(null);

  useEffect(
    () => {
      let cancelled =
        false;

      async function load() {
        try {
          const data =
            await runtimeApi.getKnowledgeOverview();

          if (
            !cancelled
          ) {
            setSnapshot(
              data,
            );
          }
        } catch {
          // ignore for now
        }
      }

      load();
    },
    [],
  );

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setView(
                "dashboard",
              )
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

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <Database className="mr-2 inline h-4 w-4" />
              Evidence
            </CardTitle>
          </CardHeader>

          <CardContent>
            {snapshot?.evidence.total ?? 0}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Brain className="mr-2 inline h-4 w-4" />
              Knowledge
            </CardTitle>
          </CardHeader>

          <CardContent>
            {
              snapshot?.knowledge
                .canonicalItems ?? 0
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <FolderGit2 className="mr-2 inline h-4 w-4" />
              Repository
            </CardTitle>
          </CardHeader>

          <CardContent>
            {
              snapshot?.recovery
                .status ?? "idle"
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Activity className="mr-2 inline h-4 w-4" />
              Progress
            </CardTitle>
          </CardHeader>

          <CardContent>
            {Math.round(
              snapshot?.recovery
                .progress ?? 0,
            )}
            %
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
