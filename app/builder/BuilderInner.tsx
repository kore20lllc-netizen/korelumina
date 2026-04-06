"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";

type Props = { projectId: string };

type DraftFile = {
  path?: string;
  file?: string;
  content?: string;
  code?: string;
};

export default function BuilderInner({ projectId }: Props) {
  const [files, setFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string>("app/page.tsx");
  const [content, setContent] = useState("");
  const [version, setVersion] = useState(0);

  const [prompt, setPrompt] = useState("");
  const [drafts, setDrafts] = useState<DraftFile[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/dev/fs/list?projectId=${projectId}`);
      const data = await res.json();
      const list = data.files || [];
      setFiles(list);

      if (list.includes("app/page.tsx")) {
        setActiveFile("app/page.tsx");
      } else if (list.length) {
        setActiveFile(list[0]);
      }
    })();
  }, [projectId]);

  useEffect(() => {
    if (!activeFile) return;

    (async () => {
      const res = await fetch(
        `/api/dev/fs/read?projectId=${projectId}&file=${encodeURIComponent(activeFile)}`
      );

      const text = await res.text();

      try {
        const json = JSON.parse(text);
        setContent(json.content || "");
      } catch {
        setContent(text);
      }
    })();
  }, [activeFile, version]);

  async function handleSave() {
    await fetch("/api/dev/fs/write", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, file: activeFile, content }),
    });

    setVersion((v) => v + 1);
  }

  async function applyDraft() {
    const draft = drafts[0];
    if (!draft) return;

    const next = draft.content || draft.code || "";

    await fetch("/api/dev/fs/write", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, file: activeFile, content: next }),
    });

    setDrafts([]);
    setContent(next);
    setVersion((v) => v + 1);
  }

  async function runAI() {
    const res = await fetch("/api/ai/orchestrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, spec: prompt }),
    });

    const data = await res.json();

    const nextDrafts = (data.drafts || data.files || []).map((d: any) => ({
      path: activeFile,
      file: activeFile,
      content: d.content || d.code || "",
      code: d.code || d.content || "",
    }));

    setDrafts(nextDrafts);
    setVersion((v) => v + 1);
  }

  function getLanguage(file: string) {
    if (file.endsWith(".tsx") || file.endsWith(".ts")) return "typescript";
    if (file.endsWith(".js")) return "javascript";
    return "plaintext";
  }

  const previewUrl = `/api/dev/preview?projectId=${projectId}&entry=${encodeURIComponent(activeFile)}&v=${version}${
    drafts.length
      ? `&drafts=${encodeURIComponent(
          btoa(
            JSON.stringify([
              {
                path: activeFile,
                content: drafts[0].content || drafts[0].code || "",
              },
            ])
          )
        )}`
      : ""
  }`;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* FILE TREE */}
      <div style={{ width: 220, borderRight: "1px solid #ddd", padding: 10 }}>
        {files.map((f) => (
          <div
            key={f}
            onClick={() => setActiveFile(f)}
            style={{
              cursor: "pointer",
              padding: 4,
              color: f === activeFile ? "#0070f3" : "#000",
            }}
          >
            {f}
          </div>
        ))}
      </div>

      {/* CENTER */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <button onClick={handleSave}>Save</button>

        <Editor
          height="50%"
          language={getLanguage(activeFile)}
          value={content}
          onChange={(v) => setContent(v || "")}
        />

        <iframe
          key={version}
          src={previewUrl}
          style={{ flex: 1, border: "none", background: "#fff" }}
        />
      </div>

      {/* RIGHT PANEL */}
      <div style={{ width: 280, padding: 10, borderLeft: "1px solid #ddd" }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          style={{ width: "100%", height: 80 }}
        />

        <button onClick={runAI}>Run AI</button>

        {drafts.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div>Diff: {activeFile}</div>

            <div style={{ display: "flex", height: 200 }}>
              <textarea value={content} readOnly style={{ width: "50%" }} />
              <textarea
                value={drafts[0].content || drafts[0].code || ""}
                readOnly
                style={{ width: "50%" }}
              />
            </div>

            <button onClick={applyDraft} style={{ marginTop: 10 }}>
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
