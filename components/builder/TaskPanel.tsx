"use client";

import { useState } from "react";

export default function TaskPanel({
  workspaceId,
  projectId,
  onResult,
}: {
  workspaceId: string;
  projectId: string;
  onResult?: (data: any) => void;
}) {
  const [spec, setSpec] = useState("");
  const [loading, setLoading] = useState(false);

  async function runTask(mode: "plan" | "draft" | "apply_repair", e?: any) {
    e?.preventDefault();

    if (!spec.trim()) return;

    setLoading(true);

    const res = await fetch("/api/ai/task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspaceId,
        projectId,
        spec,
        mode,
      }),
    });

    const data = await res.json();

    console.log("AI RESULT", data);

    onResult?.(data);

    setLoading(false);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Task</h2>

      <textarea
        value={spec}
        onChange={(e) => setSpec(e.target.value)}
        placeholder="Describe what the AI should build..."
        style={{
          width: "100%",
          height: 140,
          padding: 10,
          marginBottom: 10,
        }}
      />

      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" onClick={(e) => runTask("plan", e)} disabled={loading}>
          Generate Plan
        </button>

        <button type="button" onClick={(e) => runTask("draft", e)} disabled={loading}>
          Draft Files
        </button>

        <button type="button" onClick={(e) => runTask("apply_repair", e)} disabled={loading}>
          Apply
        </button>
      </div>
    </div>
  );
}
