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

  // LOAD FILE LIST
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

  // LOAD FILE CONTENT
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

  // SAVE FILE
  async function handleSave() {
    if (!activeFile) return;

    const res = await fetch("/api/dev/fs/write", {
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

    if (!res.ok) {
      console.error("Save failed");
      return;
    }

    // force preview refresh
    setVersion((v) => v + 1);
  }

  function getLanguage(file: string | null) {
    if (!file) return "plaintext";

    if (file.endsWith(".ts") || file.endsWith(".tsx")) return "typescript";
    if (file.endsWith(".js") || file.endsWith(".jsx")) return "javascript";
    if (file.endsWith(".json")) return "json";
    if (file.endsWith(".css")) return "css";
    if (file.endsWith(".html")) return "html";
    if (file.endsWith(".md")) return "markdown";
    if (file.endsWith(".yml") || file.endsWith(".yaml")) return "yaml";

    return "plaintext";
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0b0b0b" }}>
      
      {/* FILE TREE */}
      <div style={{ width: 250, borderRight: "1px solid #222", padding: 10, overflow: "auto" }}>
        <div style={{ fontWeight: 700, marginBottom: 10, color: "#fff" }}>Files</div>

        {files.map((file) => (
          <div
            key={file}
            onClick={() => setActiveFile(file)}
            style={{
              padding: "8px 10px",
              cursor: "pointer",
              color: activeFile === file ? "#fff" : "#ccc",
              background: activeFile === file ? "#161616" : "transparent",
              borderRadius: 6,
              marginBottom: 4,
            }}
          >
            {file}
          </div>
        ))}
      </div>

      {/* EDITOR + PREVIEW */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        
        {/* TOOLBAR */}
        <div style={{ padding: 8, borderBottom: "1px solid #222" }}>
          <button
            onClick={handleSave}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              padding: "6px 12px",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Save
          </button>
        </div>

        {/* MONACO EDITOR */}
        <div style={{ flex: 1 }}>
          <Editor
            height="100%"
            theme="vs-dark"
            language={getLanguage(activeFile)}
            value={content}
            onChange={(value) => setContent(value || "")}
          />
        </div>

        {/* PREVIEW */}
        <div style={{ flex: 1, background: "#fff" }}>
          <iframe
            src={`/api/dev/preview?projectId=${projectId}&v=${version}`}
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        </div>
      </div>

      {/* AI PANEL */}
      <div style={{ width: 300, borderLeft: "1px solid #222", padding: 10 }}>
        <div style={{ fontWeight: 700, color: "#fff" }}>AI Panel</div>
        <div style={{ color: "#888", marginTop: 8 }}>Ready</div>
      </div>
    </div>
  );
}
