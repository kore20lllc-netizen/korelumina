"use client";
import { useState } from "react";


export default function TaskSpecPanel({
  workspaceId,
  projectId,
  onResult,
}: {
  workspaceId: string;
  projectId: string;
  onResult: (data: any) => void;
}) {
  const [spec, setSpec] = useState("");

  async function runTask() {
    const res = await fetch("/api/ai/task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspaceId,
        projectId,
        mode: "draft",
        spec,
      }),
    });

    const data = await res.json();
    onResult(data);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Task Spec</h2>

      <textarea
        value={spec}
        onChange={(e) => setSpec(e.target.value)}
        style={{
          width: "100%",
          height: 150,
          fontFamily: "monospace",
        }}
      />

      <button onClick={runTask} style={{ marginTop: 10 }}>
        Generate Changes
      </button>
    </div>
  );
}
