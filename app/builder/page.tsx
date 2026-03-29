"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const projectId = "demo-project";

function unwrap(s: string) {
  try {
    const p = JSON.parse(s);
    if (p?.content) return p.content;
  } catch {}
  return s;
}

function buildDiff(before: string, after: string) {
  const b = before.split("\n");
  const a = after.split("\n");
  const max = Math.max(b.length, a.length);

  const result: { type: "same" | "add" | "remove"; line: string }[] = [];

  for (let i = 0; i < max; i++) {
    if (b[i] === a[i]) {
      result.push({ type: "same", line: b[i] || "" });
    } else {
      if (b[i] !== undefined) result.push({ type: "remove", line: b[i] });
      if (a[i] !== undefined) result.push({ type: "add", line: a[i] });
    }
  }

  return result;
}

export default function Builder() {
  const [files, setFiles] = useState<string[]>([]);
  const [active, setActive] = useState("app/page.tsx");
  const [code, setCode] = useState("");
  const [version, setVersion] = useState(0);
  const [journal, setJournal] = useState<any[]>([]);
  const [prompt, setPrompt] = useState("");
  const [diff, setDiff] = useState<{
    before: string;
    after: string;
    lines: { type: "same" | "add" | "remove"; line: string }[];
  } | null>(null);

  const booted = useRef(false);

  async function loadFiles() {
    const r = await fetch(`/api/dev/fs/list?projectId=${projectId}`);
    const d = await r.json();
    setFiles(d.files || []);
  }

  async function loadFile(file: string) {
    const r = await fetch(
      `/api/dev/fs/read?projectId=${projectId}&file=${encodeURIComponent(file)}`
    );
    const t = await r.text();
    setCode(unwrap(t));
  }

  async function loadJournal() {
    const r = await fetch(`/api/dev/journal?projectId=${projectId}`);
    const d = await r.json();
    setJournal(d.entries || []);
  }

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    (async () => {
      await Promise.all([loadFiles(), loadJournal()]);
      await loadFile("app/page.tsx");
    })();
  }, []);

  useEffect(() => {
    if (!booted.current) return;
    loadFile(active);
  }, [active]);

  async function save(newCode?: string) {
    const clean = unwrap(newCode || code);

    const res = await fetch("/api/dev/fs/write", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectId,
        file: active,
        content: clean,
      }),
    });

    if (!res.ok) {
      console.error("WRITE FAILED", await res.text());
      return;
    }

    setVersion((v) => v + 1);
    loadJournal();
  }

  async function runDiff() {
    const before = code;

    const r = await fetch("/api/dev/ai/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const d = await r.json();
    if (!d?.code) return;

    setDiff({
      before,
      after: d.code,
      lines: buildDiff(before, d.code),
    });
  }

  async function applyDiff() {
    if (!diff?.after) return;

    setCode(diff.after);
    await save(diff.after);
    setDiff(null);
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      {/* FILETREE */}
      <div
        style={{
          width: 220,
          borderRight: "1px solid #222",
          overflow: "auto",
          background: "#f3f3f3",
          flexShrink: 0,
        }}
      >
        {files.map((f) => (
          <div
            key={f}
            onClick={() => setActive(f)}
            style={{
              padding: 8,
              cursor: "pointer",
              background: active === f ? "#ddd" : "transparent",
            }}
          >
            {f}
          </div>
        ))}
      </div>

      {/* CENTER */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          minHeight: 0,
        }}
      >
        {/* EDITOR */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <Monaco
            height="100%"
            defaultLanguage="typescript"
            theme="vs-dark"
            value={code}
            onChange={(v) => setCode(v || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
            }}
          />
        </div>

        {/* CONTROLS */}
        <div
          style={{
            padding: 8,
            borderTop: "1px solid #222",
            background: "#111",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => save()}>SAVE</button>

            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask AI..."
              style={{ flex: 1 }}
            />

            <button onClick={runDiff}>DIFF</button>
          </div>

          <div style={{ marginTop: 6 }}>VERSION {version}</div>
        </div>

        {/* DIFF */}
        {diff && (
          <div
            style={{
              height: 220,
              display: "flex",
              borderTop: "1px solid #222",
              flexShrink: 0,
              minHeight: 0,
            }}
          >
            <div
              style={{
                flex: 1,
                background: "#111",
                overflow: "auto",
                padding: 6,
                fontFamily: "monospace",
                fontSize: 12,
              }}
            >
              {diff.lines.map((l, i) => (
                <div
                  key={i}
                  style={{
                    color:
                      l.type === "add"
                        ? "#0f0"
                        : l.type === "remove"
                        ? "#ff6b6b"
                        : "#aaa",
                    background:
                      l.type === "add"
                        ? "rgba(0,255,0,0.1)"
                        : l.type === "remove"
                        ? "rgba(255,0,0,0.1)"
                        : "transparent",
                    padding: "2px 4px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {l.type === "add" ? "+ " : l.type === "remove" ? "- " : "  "}
                  {l.line}
                </div>
              ))}
            </div>

            <div
              style={{
                width: 120,
                borderLeft: "1px solid #222",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#111",
                flexShrink: 0,
              }}
            >
              <button
                onClick={applyDiff}
                style={{
                  background: "#ff6b00",
                  color: "#fff",
                  border: "none",
                  padding: "8px 14px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                APPLY
              </button>
            </div>
          </div>
        )}

        {/* JOURNAL */}
        <div
          style={{
            height: 150,
            overflow: "auto",
            background: "#000",
            color: "#0f0",
            fontSize: 12,
            padding: 6,
            borderTop: "1px solid #222",
            flexShrink: 0,
          }}
        >
          {journal.map((e, i) => (
            <div key={i}>
              {new Date(e.t).toLocaleTimeString()} → {e.op} → {e.path}
            </div>
          ))}
        </div>
      </div>

      {/* PREVIEW */}
      <div
        style={{
          width: 600,
          borderLeft: "1px solid #222",
          background: "#fff",
          flexShrink: 0,
        }}
      >
        <iframe
          src={`/api/dev/preview?projectId=${projectId}&v=${version}`}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
        />
      </div>
    </div>
  );
}
