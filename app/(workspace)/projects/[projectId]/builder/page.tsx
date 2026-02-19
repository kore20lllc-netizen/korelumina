"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type State = {
  health: "idle" | "building" | "error" | "ready";
  isBuilding: boolean;
  canBuild: boolean;
  previewUrl: string | null;
  logs: string[];
};

export default function BuilderPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const workspaceId = "default";

  const [state, setState] = useState<State | null>(null);

  async function loadState() {
    const res = await fetch(
      `/api/workspaces/${workspaceId}/projects/${projectId}/state`
    );
    const json = await res.json();
    setState(json);
  }

  async function build() {
    await fetch(
      `/api/workspaces/${workspaceId}/projects/${projectId}/build`,
      { method: "POST" }
    );
    loadState();
  }

  async function startPreview() {
    await fetch(
      `/api/workspaces/${workspaceId}/projects/${projectId}/preview/start`,
      { method: "POST" }
    );
    loadState();
  }

  async function stopPreview() {
    await fetch(
      `/api/workspaces/${workspaceId}/projects/${projectId}/preview/stop`,
      { method: "POST" }
    );
    loadState();
  }

  useEffect(() => {
    loadState();
    const i = setInterval(loadState, 2000);
    return () => clearInterval(i);
  }, [projectId]);

  if (!state) return <div className="p-6">Loading...</div>;

  return (
    <div className="flex h-screen w-screen">
      {/* Main Area */}
      <div className="flex-1 p-6">
        <h1 className="text-xl font-semibold mb-4">
          Project: {projectId}
        </h1>

        <div className="border rounded p-4 h-96 overflow-auto bg-black text-green-400 text-sm">
          {state.logs?.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>

      {/* Right State Panel */}
      <div className="w-80 border-l p-4 space-y-4 bg-gray-50">
        <div>
          <div className="text-sm text-gray-500">Health</div>
          <div className="font-semibold">{state.health}</div>
        </div>

        <button
          onClick={build}
          disabled={!state.canBuild}
          className="w-full bg-black text-white py-2 rounded disabled:opacity-50"
        >
          Build
        </button>

        {state.previewUrl ? (
          <>
            <a
              href={state.previewUrl}
              target="_blank"
              className="block text-blue-600 underline"
            >
              Open Preview
            </a>

            <button
              onClick={stopPreview}
              className="w-full border py-2 rounded"
            >
              Stop Preview
            </button>
          </>
        ) : (
          <button
            onClick={startPreview}
            className="w-full border py-2 rounded"
          >
            Start Preview
          </button>
        )}
      </div>
    </div>
  );
}
