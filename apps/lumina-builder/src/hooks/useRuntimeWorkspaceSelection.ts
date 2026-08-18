import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  Environment,
  HealthStatus,
  RuntimeSnapshot,
} from "@/services/runtime/types";

export interface RuntimeWorkspaceSelection {
  selectedId: string | null;
  setSelectedId: React.Dispatch<
    React.SetStateAction<string | null>
  >;

  query: string;
  setQuery: React.Dispatch<
    React.SetStateAction<string>
  >;

  environment: Environment | "all";
  setEnvironment: React.Dispatch<
    React.SetStateAction<
      Environment | "all"
    >
  >;

  health: HealthStatus | "all";
  setHealth: React.Dispatch<
    React.SetStateAction<
      HealthStatus | "all"
    >
  >;

  inspectorOpen: boolean;
  setInspectorOpen: React.Dispatch<
    React.SetStateAction<boolean>
  >;

  filteredProjects: RuntimeSnapshot["projects"];
  selectedProject:
    RuntimeSnapshot["projects"][number] | null;

  selectedEvents:
    RuntimeSnapshot["events"];

  selectedTimeline:
    RuntimeSnapshot["timeline"];

  selectedLogs:
    RuntimeSnapshot["logs"];
}

export function useRuntimeWorkspaceSelection(
  snapshot: RuntimeSnapshot | null,
): RuntimeWorkspaceSelection {
  const [
    selectedId,
    setSelectedId,
  ] = useState<string | null>(
    null,
  );

  const [
    query,
    setQuery,
  ] = useState("");

  const [
    environment,
    setEnvironment,
  ] = useState<
    Environment | "all"
  >("all");

  const [
    health,
    setHealth,
  ] = useState<
    HealthStatus | "all"
  >("all");

  const [
    inspectorOpen,
    setInspectorOpen,
  ] = useState(false);

  useEffect(() => {
    if (
      selectedId ||
      !snapshot?.projects.length
    ) {
      return;
    }

    setSelectedId(
      snapshot.projects[0].id,
    );
  }, [
    selectedId,
    snapshot,
  ]);

  const filteredProjects =
    useMemo(() => {
      if (!snapshot) {
        return [];
      }

      const normalizedQuery =
        query.trim().toLowerCase();

      return snapshot.projects.filter(
        (project) => {
          if (
            environment !== "all" &&
            project.env !==
              environment
          ) {
            return false;
          }

          if (
            health !== "all" &&
            project.health.status !==
              health
          ) {
            return false;
          }

          if (
            !normalizedQuery
          ) {
            return true;
          }

          return [
            project.name,
            project.region,
            project.version,
            project.env,
          ].some((value) =>
            value
              .toLowerCase()
              .includes(
                normalizedQuery,
              ),
          );
        },
      );
    }, [
      environment,
      health,
      query,
      snapshot,
    ]);

  const selectedProject =
    useMemo(
      () =>
        snapshot?.projects.find(
          (project) =>
            project.id ===
            selectedId,
        ) ?? null,
      [
        selectedId,
        snapshot,
      ],
    );

  const selectedEvents =
    useMemo(
      () =>
        (
          snapshot?.events ??
          []
        ).filter(
          (event) =>
            !selectedProject ||
            event.projectId ===
              selectedProject.id,
        ),
      [
        selectedProject,
        snapshot,
      ],
    );

  const selectedTimeline =
    useMemo(
      () =>
        (
          snapshot?.timeline ??
          []
        ).filter(
          (event) =>
            !selectedProject ||
            event.projectId ===
              selectedProject.id,
        ),
      [
        selectedProject,
        snapshot,
      ],
    );

  const selectedLogs =
    useMemo(
      () =>
        (
          snapshot?.logs ??
          []
        ).filter(
          (log) =>
            !selectedProject ||
            log.projectId ===
              selectedProject.id,
        ),
      [
        selectedProject,
        snapshot,
      ],
    );

  return {
    selectedId,
    setSelectedId,

    query,
    setQuery,

    environment,
    setEnvironment,

    health,
    setHealth,

    inspectorOpen,
    setInspectorOpen,

    filteredProjects,
    selectedProject,

    selectedEvents,
    selectedTimeline,
    selectedLogs,
  };
}

export default
  useRuntimeWorkspaceSelection;
