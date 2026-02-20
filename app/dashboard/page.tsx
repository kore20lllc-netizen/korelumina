"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ProjectState = {
  name: string;
  status: string;
  previewUrl?: string | null;
};

export default function DashboardPage() {
  const workspaceId = "default";

  const [projects, setProjects] = useState<string[]>([]);
  const [states, setStates] = useState<Record<string, ProjectState>>({});

  // Fetch projects
  async function loadProjects() {
    try {
      const r = await fetch(
        `/api/workspaces/${workspaceId}/projects`
      );
      const data = await r.json();
      setProjects(data.projects || []);
    } catch {}
  }

  // Fetch state for all projects
  async function loadStates(projectList: string[]) {
    for (const projectId of projectList) {
      try {
        const r = await fetch(
          `/api/workspaces/${workspaceId}/projects/${projectId}/state`
        );
        const data = await r.json();

        setStates((prev) => ({
          ...prev,
          [projectId]: {
            name: projectId,
            status: data?.status || "idle",
            previewUrl: data?.preview?.url || null,
          },
        }));
      } catch {
        setStates((prev) => ({
          ...prev,
          [projectId]: {
            name: projectId,
            status: "error",
          },
        }));
      }
    }
  }

  useEffect(() => {
    let mounted = true;

    async function refresh() {
      if (!mounted) return;
      await loadProjects();
    }

    refresh();

    const interval = setInterval(refresh, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (projects.length === 0) return;

    loadStates(projects);

    const interval = setInterval(() => {
      loadStates(projects);
    }, 5000);

    return () => clearInterval(interval);
  }, [projects]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        Workspace Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((projectId) => {
          const state = states[projectId];

          return (
            <div
              key={projectId}
              className="border rounded-lg p-4 shadow-sm bg-white"
            >
              <h2 className="font-semibold text-lg mb-2">
                {projectId}
              </h2>

              <p className="text-sm mb-2">
                Status:{" "}
                <span className="font-medium">
                  {state?.status || "loading"}
                </span>
              </p>

              {state?.previewUrl && (
                <a
                  href={state.previewUrl}
                  target="_blank"
                  className="text-blue-600 text-sm block mb-2"
                >
                  Open Preview
                </a>
              )}

              <div className="flex gap-2 mt-2">
                <Link
                  href={`/projects/${projectId}/builder`}
                  className="text-sm bg-black text-white px-3 py-1 rounded"
                >
                  Builder
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
