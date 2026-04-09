"use client";
import { useState } from "react";


export default function ChatPanel({
  workspaceId,
  projectId,
  onPlan,
}: {
  workspaceId: string;
  projectId: string;
  onPlan: (data: any) => void;
}) {
  const [prompt, setPrompt] = useState("");

  async function planTask() {
    const res = await fetch("/api/ai/task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspaceId,
        projectId,
        mode: "plan",
        spec: prompt,
      }),
    });

    const data = await res.json();
    onPlan(data);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>AI Chat</h2>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        style={{
          width: "100%",
          height: 120,
          fontFamily: "monospace",
        }}
      />

      <button onClick={planTask} style={{ marginTop: 10 }}>
        Generate Plan
      </button>
    </div>
  );
}
