"use client";

import { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import PreviewFrame from "@/components/builder/PreviewFrame";
import { DiffEditor } from "@monaco-editor/react";

function detectLanguage(file?: string) {
  if (!file) return "typescript";

  const ext = file.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "ts":
    case "tsx":
      return "typescript";
    case "js":
    case "jsx":
      return "javascript";
    case "css":
      return "css";
    case "json":
      return "json";
    default:
      return "plaintext";
  }
}
export default function BuilderInner({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const [editorValue, setEditorValue] = useState("");
  const [draftValue, setDraftValue] = useState("");
  const [hasDraft, setHasDraft] = useState(false);

  const [aiInput, setAiInput] = useState("");
  const [previewVersion, setPreviewVersion] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  (async () => {
    const res = await fetch(`/api/dev/fs/list?projectId=${projectId}`);
    const data = await res.json();

    const list = (data.files || []).filter(
      (f: string) =>
        (f.endsWith(".tsx") || f.endsWith(".ts") || f.endsWith(".js")) &&
        !f.includes("__preview__") &&
        !f.includes("__preview_wrapper__")
    );

    setFiles(list);

    // ✅ define helper
    function pickBestFile(files: string[]) {
      const priorities = [
        "app/page.tsx",
        "app/(dashboard)/page.tsx",
      ];

      for (const p of priorities) {
        if (files.includes(p)) return p;
      }

      const page = files.find((f) => f.endsWith("/page.tsx"));
      if (page) return page;

      const tsx = files.find((f) => f.endsWith(".tsx"));
      if (tsx) return tsx;

      return files[0];
    }

      // 🔥 LOCK: only set once
    setActiveFile((prev) => {
      if (prev) return prev; // ← prevents override
      const best = pickBestFile(list);
      setSelectedFile(best);
      return best;
    });
  })();
}, [projectId]);

  useEffect(() => {
    if (!activeFile) return;

    (async () => {
      const res = await fetch(
        `/api/dev/fs/read?projectId=${projectId}&file=${encodeURIComponent(
          activeFile
        )}`
      );

      const text = await res.text();

      let final = text;
      try {
        const json = JSON.parse(text);
        final = json.content || "";
      } catch {}

      setEditorValue(final);
      setDraftValue("");
      setHasDraft(false);
    })();
  }, [activeFile, previewVersion, projectId]);

  async function runAI() {
    if (!aiInput.trim() || loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/ai/orchestrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          spec: aiInput,
        }),
      });

      const data = await res.json();
      const code = data?.drafts?.[0]?.code;

      if (!code) return;

      setDraftValue(code);
      setHasDraft(true);
    } finally {
      setLoading(false);
    }
  }

  async function applyDraft() {
    if (!hasDraft) return;

    await fetch("/api/dev/fs/write", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        file: activeFile,
        content: draftValue,
      }),
    });

    setHasDraft(false);
    setDraftValue("");
    setPreviewVersion(Date.now());
  }

  async function save() {
    await fetch("/api/dev/fs/write", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        file: activeFile,
        content: editorValue,
      }),
    });

    setPreviewVersion(Date.now());
  }

  const previewUrl = useMemo(() => {
    return `/api/dev/preview?projectId=${projectId}&entry=${encodeURIComponent(
      activeFile
    )}&v=${previewVersion}`;
  }, [projectId, activeFile, previewVersion]);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#111" }}>
      <div
        style={{
          width: 240,
          background: "#0b0b0b",
          color: "#fff",
          overflowY: "auto",
          borderRight: "1px solid #222",
        }}
      >
        {files.map((f) => (
          <div
            key={f}
            onClick={() => {
  setActiveFile(f);
  setSelectedFile(f);
}}
            style={{
              padding: 8,
              cursor: "pointer",
              background: f === activeFile ? "#111827" : "transparent",
            }}
          >
            {f}
          </div>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#111",
        }}
      >
        <div style={{ padding: 10, borderBottom: "1px solid #222" }}>
          <textarea
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder="Describe what to build..."
            style={{
              width: "100%",
              height: 70,
              background: "#020617",
              color: "#fff",
              padding: 10,
              border: "1px solid #333",
              borderRadius: 6,
              outline: "none",
            }}
          />

          <button
            onClick={runAI}
            style={{
              marginTop: 8,
              padding: "8px 14px",
              background: loading ? "#475569" : "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Running..." : "Run AI"}
          </button>

          {hasDraft && (
            <button
              onClick={applyDraft}
              style={{
                marginLeft: 10,
                padding: "8px 14px",
                background: "#f59e0b",
                color: "#000",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Apply
            </button>
          )}
        </div>

        <div style={{ flex: 1, display: "flex", background: "#0b0b0b" }}>
  {/* LEFT: MAIN EDITOR */}
  <div
    style={{
      width: hasDraft ? "50%" : "100%",
      borderRight: hasDraft ? "1px solid #1e293b" : "none",
    }}
  >
    <div
      style={{
        padding: "6px 10px",
        background: "#020617",
        borderBottom: "1px solid #1e293b",
        fontSize: 12,
        color: "#94a3b8",
        fontWeight: 600,
      }}
    >
      Editor
    </div>

    <Editor
      height="100%"
      defaultLanguage={detectLanguage(activeFile)}
      theme="kore-dark"
      value={editorValue}
      beforeMount={(monaco) => {
        monaco.editor.defineTheme("kore-dark", {
          base: "vs-dark",
          inherit: true,
          rules: [
            { token: "comment", foreground: "6A9955" },
            { token: "keyword", foreground: "C586C0" },
            { token: "string", foreground: "CE9178" },
            { token: "number", foreground: "B5CEA8" },
            { token: "type.identifier", foreground: "4EC9B0" },
            { token: "identifier", foreground: "9CDCFE" },
          ],
          colors: {
            "editor.background": "#0b0b0b",
          },
        });
      }}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        wordWrap: "on",
        automaticLayout: true,
        tabSize: 2,
        scrollBeyondLastLine: false,
        lineNumbers: "on",
        cursorSmoothCaretAnimation: "on",
        semanticHighlighting: true,
      }}
      onChange={(v) => setEditorValue(v || "")}
    />
  </div>

  {/* RIGHT: DIFF VIEW */}
  {hasDraft && (
    <div style={{ width: "50%", background: "#020617" }}>
      <div
        style={{
          padding: "6px 10px",
          background: "#020617",
          borderBottom: "1px solid #1e293b",
          fontSize: 12,
          color: "#f59e0b",
          fontWeight: 600,
        }}
      >
        AI Diff (Changes)
      </div>

      <DiffEditor
        height="100%"
        original={editorValue}
        modified={draftValue}
        language={detectLanguage(activeFile)}
        theme="vs-dark"
        options={{
          readOnly: true,
          renderSideBySide: true,
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,

          // 🔥 diff visuals
          renderIndicators: true,
          renderLineHighlight: "all",
          ignoreTrimWhitespace: false,
        }}
      />
    </div>
  )}
</div>

        <div
          style={{
            padding: 10,
            background: "#020617",
            borderTop: "1px solid #222",
          }}
        >
          <button
            onClick={save}
            style={{
              padding: "8px 14px",
              background: "#22c55e",
              color: "#000",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Save
          </button>
        </div>
      </div>

      <div
  style={{
    width: 420,
    background: "#fff",
    borderLeft: "1px solid #222",
  }}
>
  <PreviewFrame
    projectId={projectId}
    version={previewVersion}
    file={activeFile}
  />
</div>
      </div>
  );
}
