"use client";

import { useEffect, useState } from "react";

type Health = "idle" | "healthy" | "error";

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const workspaceId = "default";

  const [health, setHealth] = useState<Health>("idle");
  const [isBuilding, setIsBuilding] = useState(false);
  const [lastSuccessAt, setLastSuccessAt] = useState<string | null>(null);
  const [lastDurationMs, setLastDurationMs] = useState<number | null>(null);

  async function fetchState() {
    const res = await fetch(
      `/api/workspaces/${workspaceId}/projects/${projectId}/state`
    );
    if (!res.ok) return;

    const data = await res.json();

    if (data.status === "success") {
      setHealth("healthy");
    } else if (data.status === "failed") {
      setHealth("error");
    } else {
      setHealth("idle");
    }

    setLastSuccessAt(data.lastSuccessAt ?? null);
    setLastDurationMs(data.lastDurationMs ?? null);
  }

  async function handleBuild() {
    try {
      setIsBuilding(true);

      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/build`,
        { method: "POST" }
      );

      if (!res.ok) {
        throw new Error("Build failed");
      }

      await fetchState();
    } catch (err) {
      console.error(err);
      setHealth("error");
    } finally {
      setIsBuilding(false);
    }
  }

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col">
      <header className="h-14 border-b px-6 flex items-center justify-between bg-background">
        <div className="flex flex-col">
          <span className="font-semibold text-sm">
            Project: {projectId}
          </span>
          <span className="text-xs text-muted-foreground">
            {lastSuccessAt
              ? `Last success: ${new Date(lastSuccessAt).toLocaleString()}`
              : "No successful builds yet"}
            {lastDurationMs
              ? ` • Duration: ${(lastDurationMs / 1000).toFixed(1)}s`
              : ""}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-2 py-1 rounded ${
              health === "healthy"
                ? "bg-green-100 text-green-700"
                : health === "error"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {health.toUpperCase()}
          </span>

          <button
            onClick={handleBuild}
            disabled={isBuilding}
            className={`px-4 py-1.5 text-sm rounded transition ${
              isBuilding
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-black text-white hover:opacity-90"
            }`}
          >
            {isBuilding ? "Building..." : "Build"}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center text-muted-foreground">
        Builder workspace
      </main>
    </div>
  );
}
