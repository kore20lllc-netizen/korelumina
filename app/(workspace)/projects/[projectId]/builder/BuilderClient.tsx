"use client";

import { useEffect, useState } from "react";

type Health = "idle" | "building" | "error" | "ready";

export default function BuilderClient({
  projectId,
}: {
  projectId: string;
}) {
  const workspaceId = "default";

  const [health, setHealth] = useState<Health>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);

  const stateUrl = `/api/workspaces/${workspaceId}/projects/${projectId}/state`;
  const buildUrl = `/api/workspaces/${workspaceId}/projects/${projectId}/build`;
  const previewStartUrl = `/api/workspaces/${workspaceId}/projects/${projectId}/preview/start`;
  const previewStopUrl = `/api/workspaces/${workspaceId}/projects/${projectId}/preview/stop`;
  const eventsUrl = `/api/workspaces/${workspaceId}/projects/${projectId}/events`;

  async function refreshState() {
    const r = await fetch(stateUrl);
    const j = await r.json();
    setHealth(j.health);
    setIsBuilding(j.isBuilding);
  }

  async function triggerBuild() {
    await fetch(buildUrl, { method: "POST" });
  }

  async function startPreview() {
    await fetch(previewStartUrl, { method: "POST" });
  }

  async function stopPreview() {
    await fetch(previewStopUrl, { method: "POST" });
  }

  useEffect(() => {
    refreshState();

    const es = new EventSource(eventsUrl);

    es.onmessage = (e) => {
      setLogs((prev) => [...prev.slice(-300), e.data]);
    };

    return () => {
      es.close();
    };
  }, []);

  function badgeColor() {
    switch (health) {
      case "building":
        return "bg-yellow-500";
      case "ready":
        return "bg-green-600";
      case "error":
        return "bg-red-600";
      default:
        return "bg-gray-500";
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold">
          Builder — {projectId}
        </h1>

        <span
          className={`px-3 py-1 rounded text-white text-sm ${badgeColor()}`}
        >
          {health}
        </span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={triggerBuild}
          disabled={isBuilding}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Build
        </button>

        <button
          onClick={startPreview}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Preview
        </button>

        <button
          onClick={stopPreview}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Stop Preview
        </button>
      </div>

      <div className="border rounded p-4 bg-black text-green-400 text-sm h-96 overflow-auto font-mono">
        {logs.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}
