"use client";

import { useState } from "react";
import LogPanel from "@/components/builder/LogPanel";

type Health = "idle" | "building" | "previewing";

export default function BuilderClient({
  projectId,
}: {
  projectId: string;
}) {
  const workspaceId = "default";
  const [health, setHealth] = useState<Health>("idle");

  async function triggerBuild() {
    setHealth("building");

    await fetch(
      `/api/workspaces/${workspaceId}/projects/${projectId}/build`,
      { method: "POST" }
    );

    setHealth("previewing");
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">
        Builder – {projectId}
      </h1>

      <button
        onClick={triggerBuild}
        className="px-4 py-2 bg-black text-white rounded"
      >
        Build
      </button>

      <LogPanel workspaceId={workspaceId} projectId={projectId} />
    </div>
  );
}
