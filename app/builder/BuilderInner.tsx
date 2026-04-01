"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";

type Props = {
  projectId: string;
};

export default function BuilderInner({ projectId }: Props) {
  const [files, setFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [version, setVersion] = useState(0);

  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);

  // LOAD FILES
  useEffect(() => {
    async function loadFiles() {
      const res = await fetch(`/api/dev/fs/list?projectId=${projectId}`);
      const data = await res.json();
      const list = data.files || [];
      setFiles(list);
      setActiveFile(list[0] || null);
    }
    loadFiles();
  }, [projectId]);

  // LOAD CONTENT
  useEffect(() => {
    if (!activeFile) return;

    async function loadContent() {
      const res = await fetch(
        `/api/dev/fs/read?projectId=${projectId}&file=${encodeURIComponent(activeFile)}`
      );
      const text = await res.text();

      try {
        const data = JSON.parse(text);
        setContent(data.content || "");
      } catch {
        setContent(text);
      }
    }

    loadContent();
  }, [activeFile, projectId]);

  // SAVE
  async function handleSave() {
    if (!activeFile) return;

    await fetch("/api/dev/fs/write", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        file: activeFile,
        content,
      }),
    });

    setVersion((v) => v + 1);
  }

  // APPLY
  async function applyDraft(draft: any) {
    await fetch("/api/dev/fs/write", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        file: draft.file,
        content: draft.content,
      }),
    });

    setVersion((v) => v + 1);
    setActiveFile(draft.file);
    setContent(draft.content);
  }

  // AI
  async function runAI() {
    const res = await fetch("/api/ai/orchestrate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        spec: prompt,
      }),
    });

    const data = await res.json();
    setPlan(data.files || []);
    setDrafts(data.drafts || []);
  }

  function getLanguage(file: string | null) {
    if (!file) return "plaintext";
    if (file.endsWith(".ts") || file.endsWith(".tsx")) return "typescript";
    if (file.endsWith(".js")) return "javascript";
    if (file.endsWith(".json")) return "json";
    return "plaintext";
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#0a0a0a",
        color: "#e5e5e5"
      }}
    >
      
      {/* FILE TREE */}
      <div
        style={{
          width: 250,
          borderRight: "1px solid #222",
          padding: 10,
          background: "#0f0f0f",
          overflow: "auto",
          flexShrink: 0
        }}
      >
        {files.map((f) => (
          <div key={f} onClick={() => setActiveFile(f)} style={{ cursor: "pointer" }}>
            {f}
          </div>
        ))}
      </div>

      {/* EDITOR */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#0a0a0a"
        }}
      >
        <button onClick={handleSave}>Save</button>

        <Editor
          height="50%"
          theme="vs-dark"
          language={getLanguage(activeFile)}
          value={content}
          onChange={(v) => setContent(v || "")}
        />

        <iframe
          src={`/api/dev/preview?projectId=${projectId}&v=${version}`}
          style={{ flex: 1, background: "#fff" }}
        />
      </div>

      {/* AI PANEL */}
      <div
        style={{
          width: 300,
          padding: 10,
          background: "#0f0f0f",
          borderLeft: "1px solid #222"
        }}
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          style={{ width: "100%", height: 80 }}
        />

        <button
  onClick={runAI}
  style={{
    background: "#16a34a",
    color: "#ffffff",
    border: "none",
    padding: "10px",
    width: "100%",
    borderRadius: 6,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 8
  }}
>
  Run AI
</button>

        <div>
          {plan.map((f) => (
            <div key={f}>{f}</div>
          ))}
        </div>

        {/* CLEAN DIFF VIEW */}
        {drafts.map((d, i) => (
          <div key={i} style={{ marginTop: 10 }}>
            <button
  onClick={() => applyDraft(d)}
  style={{
    background: "#f59e0b",
    color: "#000",
    border: "none",
    padding: "6px 10px",
    borderRadius: 4,
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 6
  }}
>
  Apply
</button>

            <div style={{ fontSize: 10 }}>
              <div>Current:</div>
              <pre style={{
  background: "#111",
  color: "#9ca3af",
  padding: "8px",
  borderRadius: 4,
  overflow: "auto"
}}>
  {content}
</pre>

              <div>Proposed:</div>
              <pre style={{
  background: "#052e16",
  color: "#bbf7d0",
  padding: "8px",
  borderRadius: 4,
  overflow: "auto"
}}>
  {d.content}
</pre>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
