"use client";

import { useEffect, useState } from "react";

export default function TaskStatusPanel({
  workspaceId,
  projectId,
}: {
  workspaceId: string;
  projectId: string;
}) {
  const [status, setStatus] = useState<any>(null);

  async function loadStatus() {
    try {
      const res = await fetch(
        `/api/ai/journal?workspaceId=${workspaceId}&projectId=${projectId}`
      );
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  if (!status) return <div>Loading task status…</div>;

  return (
    <div style={{ padding: 16, borderTop: "1px solid #ddd" }}>
      <h3>Task Status</h3>
      <pre style={{ fontSize: 12, overflow: "auto" }}>
        {JSON.stringify(status, null, 2)}
      </pre>
    </div>
  );
}
