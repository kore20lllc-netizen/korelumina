"use client";

import { useEffect, useState } from "react";
import FileTree from "./FileTree";
import TaskPanel from "./TaskPanel";
import DiffPanel from "./DiffPanel";

export default function Shell({
  workspaceId,
  projectId,
}: {
  workspaceId: string;
  projectId: string;
}) {
  const [result, setResult] = useState<any>(null);

  async function loadLatest() {
    const res = await fetch(
      `/api/ai/journal?workspaceId=${workspaceId}&projectId=${projectId}`
    );

    const data = await res.json();

    const events = data?.events || [];

    if (events.length) {
      const last = events[events.length - 1];
      setResult(last?.payload || null);
    }
  }

  useEffect(() => {
    loadLatest();

    const handler = () => loadLatest();
    window.addEventListener("builder:file-change", handler);

    return () => {
      window.removeEventListener("builder:file-change", handler);
    };
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr 1fr",
        height: "100vh",
      }}
    >
      <div style={{ borderRight: "1px solid #ddd" }}>
        <FileTree workspaceId={workspaceId} projectId={projectId} />
      </div>

      <div style={{ borderRight: "1px solid #ddd" }}>
        <TaskPanel
          workspaceId={workspaceId}
          projectId={projectId}
          onResult={() => {
            window.dispatchEvent(new Event("builder:file-change"));
          }}
        />
      </div>

      <div>
        <DiffPanel result={result} />
      </div>
    </div>
  );
}
