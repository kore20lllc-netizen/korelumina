"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Editor from "@monaco-editor/react";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderDiffHtml(before: string, after: string) {
  const a = before.split("\n");
  const b = after.split("\n");
  const max = Math.max(a.length, b.length);
  const rows: string[] = [];

  for (let i = 0; i < max; i += 1) {
    const left = a[i] ?? "";
    const right = b[i] ?? "";

    let bg = "transparent";
    if (left !== right && left && right) bg = "#3a2a00";
    if (left && !right) bg = "#3a0000";
    if (!left && right) bg = "#002a00";

    rows.push(
      `<tr style="background:${bg}">
        <td style="width:50%;vertical-align:top;padding:6px 8px;border-right:1px solid #333;white-space:pre-wrap;font-family:monospace;">${escapeHtml(left)}</td>
        <td style="width:50%;vertical-align:top;padding:6px 8px;white-space:pre-wrap;font-family:monospace;">${escapeHtml(right)}</td>
      </tr>`
    );
  }

  return `
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#161616">
          <th style="text-align:left;padding:8px;border-right:1px solid #333;">Current</th>
          <th style="text-align:left;padding:8px;">Proposed</th>
        </tr>
      </thead>
      <tbody>
        ${rows.join("")}
      </tbody>
    </table>
  `;
}

export default function BuilderPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "repo-test";

  const [files, setFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState("app/page.tsx");
  const [code, setCode] = useState("");
  const [savedCode, setSavedCode] = useState("");
  const [version, setVersion] = useState(0);
  const [aiInput, setAiInput] = useState("");
  const [draftCode, setDraftCode] = useState("");
  const [draftPath, setDraftPath] = useState("");
  const [isRunningAi, setIsRunningAi] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    fetch(`/api/dev/fs/list?projectId=${projectId}`)
      .then((r) => r.json())
      .then((d) => setFiles(d.files || []));
  }, [projectId]);

  useEffect(() => {
    fetch(`/api/dev/fs/read?projectId=${projectId}&file=${encodeURIComponent(activeFile)}`)
      .then((r) => r.json())
      .then((d) => {
        const content = d.content || "";
        setCode(content);
        setSavedCode(content);
        setDraftCode("");
        setDraftPath("");
        setStatus("idle");
      });
  }, [projectId, activeFile]);

  async function handleSave() {
    await fetch("/api/dev/fs/write", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectId,
        file: activeFile,
        content: code,
      }),
    });

    setSavedCode(code);
    setVersion((v) => v + 1);
    setStatus("saved");
  }

  async function runAI() {
    if (!aiInput.trim()) return;

    setIsRunningAi(true);
    setStatus("drafting");

    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspaceId: "default",
          projectId,
          spec: aiInput,
        }),
      });

      const data = await res.json();
      const draftFiles = Array.isArray(data?.files) ? data.files : [];
      const match =
        draftFiles.find((f: any) => f?.path === activeFile) ||
        draftFiles[0];

      if (!match || typeof match.content !== "string") {
        setStatus("no-draft");
        setDraftCode("");
        setDraftPath("");
        return;
      }

      setDraftCode(match.content);
      setDraftPath(match.path || activeFile);
      setStatus("draft-ready");
    } catch (err) {
      console.error(err);
      setStatus("draft-error");
    } finally {
      setIsRunningAi(false);
    }
  }

  async function applyDraft() {
    if (!draftCode || !draftPath) return;

    setIsApplying(true);
    setStatus("applying");

    try {
      await fetch("/api/dev/fs/write", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId,
          file: draftPath,
          content: draftCode,
        }),
      });

      if (draftPath === activeFile) {
        setCode(draftCode);
        setSavedCode(draftCode);
      } else {
        setActiveFile(draftPath);
      }

      setDraftCode("");
      setDraftPath("");
      setVersion((v) => v + 1);
      setStatus("applied");
    } catch (err) {
      console.error(err);
      setStatus("apply-error");
    } finally {
      setIsApplying(false);
    }
  }

  const diffHtml = useMemo(() => {
    const right = draftCode || code;
    return renderDiffHtml(savedCode, right);
  }, [savedCode, code, draftCode]);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0b0b0b", color: "#eaeaea" }}>
      {/* FILE TREE */}
      <div style={{ width: 250, borderRight: "1px solid #222", padding: 10, overflow: "auto" }}>
        <div style={{ marginBottom: 10, fontWeight: 700 }}>Files</div>
        {files.map((f) => (
          <div
            key={f}
            onClick={() => setActiveFile(f)}
            style={{
              cursor: "pointer",
              padding: "6px 8px",
              borderRadius: 6,
              background: f === activeFile ? "#1b1b1b" : "transparent",
              color: f === activeFile ? "#fff" : "#bbb",
              marginBottom: 2,
              fontFamily: "monospace",
              fontSize: 12,
            }}
          >
            {f}
          </div>
        ))}
      </div>

      {/* CENTER */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* HEADER */}
        <div style={{ padding: 10, borderBottom: "1px solid #222", display: "flex", gap: 10, alignItems: "center" }}>
          <div>
            Project: <b>{projectId}</b>
          </div>
          <div style={{ color: "#999" }}>|</div>
          <div style={{ fontFamily: "monospace" }}>{activeFile}</div>
          <button onClick={handleSave}>SAVE</button>
          <button
  onClick={applyDraft}
  disabled={!draftCode || isApplying}
  style={{
    background: draftCode ? "#22c55e" : "#555",
    color: "#000",
    padding: "6px 12px",
    borderRadius: 6,
    border: "none",
    fontWeight: 600,
    cursor: draftCode ? "pointer" : "not-allowed"
  }}
>
            {isApplying ? "APPLYING..." : "APPLY DRAFT"}
          </button>
          <div style={{ marginLeft: "auto", fontSize: 12, color: "#aaa" }}>
            status: {status}
          </div>
        </div>

        {/* EDITOR */}
        <div style={{ height: "42%" }}>
          <Editor
            height="100%"
            defaultLanguage="typescript"
            value={code}
            onChange={(v) => setCode(v || "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
            }}
          />
        </div>

        {/* PREVIEW */}
        <div style={{ height: "28%", borderTop: "1px solid #222" }}>
          <iframe
            key={version}
            src={`/api/dev/preview?projectId=${projectId}&v=${version}`}
            style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
          />
        </div>

        {/* REAL DIFF PANEL */}
        <div style={{ height: "30%", borderTop: "1px solid #222", overflow: "auto", background: "#111" }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #222", fontWeight: 700 }}>
            Diff {draftPath ? `— ${draftPath}` : ""}
          </div>
          <div
            dangerouslySetInnerHTML={{ __html: diffHtml }}
          />
        </div>
      </div>

      {/* AI PANEL */}
      <div style={{ width: 320, borderLeft: "1px solid #222", padding: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>AI Panel</div>

        <textarea
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
          placeholder="Describe the change you want..."
          style={{
            width: "100%",
            height: 120,
            marginBottom: 10,
            background: "#111",
            color: "#fff",
            border: "1px solid #333",
            padding: 10,
          }}
        />

        <button onClick={runAI} disabled={isRunningAi} style={{ width: "100%", marginBottom: 10 }}>
          {isRunningAi ? "RUNNING..." : "RUN AI DRAFT"}
        </button>

        <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.5 }}>
          <div>Draft target: {draftPath || "none"}</div>
          <div>Draft loaded: {draftCode ? "yes" : "no"}</div>
          <div>Apply only after reviewing the diff panel.</div>
        </div>
      </div>
    </div>
  );
}
