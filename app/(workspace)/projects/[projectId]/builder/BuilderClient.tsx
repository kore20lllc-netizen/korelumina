"use client";

import { useState } from "react";
import LogPanel from "@/components/builder/LogPanel";
import StatusBadge from "@/components/builder/StatusBadge";

export default function BuilderClient({
  projectId
}: {
  projectId: string;
}) {
  const workspaceId = "default";

  const [job, setJob] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);

  async function triggerBuild() {
    await fetch(
      `/api/workspaces/${workspaceId}/projects/${projectId}/build`,
      { method: "POST" }
    );
  }

  async function startPreview() {
    await fetch(
      `/api/workspaces/${workspaceId}/projects/${projectId}/preview/start`,
      { method: "POST" }
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={triggerBuild}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Build
        </button>

        <button
          onClick={startPreview}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Preview
        </button>

        <StatusBadge job={job} preview={preview} />
      </div>

      <LogPanel workspaceId={workspaceId} projectId={projectId} />
    </div>
  );
}
