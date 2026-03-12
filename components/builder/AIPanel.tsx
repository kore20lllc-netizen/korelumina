"use client";
import { useState } from "react";

export default function AIPanel({ projectId }: { projectId: string }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  async function runAI() {
    if (!prompt.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, prompt }),
      });

      const data = await res.json();
      console.log("AI RESULT:", data);

      window.dispatchEvent(new Event("korelumina:fs-change"));
      console.log("korelumina:fs-change");

      if (data?.newFile) {
        window.dispatchEvent(
          new CustomEvent("korelumina:open-file", {
            detail: `app/${data.newFile}`,
          })
        );
        console.log("korelumina:open-file", `app/${data.newFile}`);
      }

      alert("AI step complete — preview refreshed");
    } catch (e) {
      console.error(e);
      alert("AI error");
    }

    setLoading(false);
  }

  return (
    <div
      style={{
        width: 320,
        borderLeft: "1px solid #ddd",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <b>AI Builder</b>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe what to build..."
        style={{ height: 140 }}
      />

      <button onClick={runAI} disabled={loading}>
        {loading ? "Running..." : "Run AI"}
      </button>
    </div>
  );
}
