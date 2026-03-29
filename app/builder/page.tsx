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

export default function Builder() {
  const [files, setFiles] = useState<string[]>([]);
  const [active, setActive] = useState("app/page.tsx");
  const [code, setCode] = useState("");
  const [version, setVersion] = useState(0);
  const [journal, setJournal] = useState<any[]>([]);
  const [prompt, setPrompt] = useState("");

  // 🔥 NEW
  const [diff, setDiff] = useState<{ before: string; after: string } | null>(null);

  const booted = useRef(false);

  function loadFiles() {
    fetch(`/api/dev/fs/list?projectId=${projectId}`)
      .then(r => r.json())
      .then(d => setFiles(d.files || []));
  }

  function loadFile(file: string) {
    fetch(`/api/dev/fs/read?projectId=${projectId}&file=${encodeURIComponent(file)}`)
      .then(r => r.text())
      .then(t => setCode(unwrap(t)));
  }

  function loadJournal() {
    fetch(`/api/dev/journal?projectId=${projectId}`)
      .then(r => r.json())
      .then(d => setJournal(d.entries || []));
  }

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    loadFiles();
    loadFile(active);
    loadJournal();
  }, []);

  useEffect(() => {
    loadFile(active);
  }, [active]);

  async function save(newCode?: string) {
    const clean = unwrap(newCode || code);

    await fetch("/api/dev/fs/write", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectId,
        file: active,
        content: clean,
      }),
    });

    setVersion(v => v + 1);
    loadJournal();
  }

  // 🔥 UPDATED DIFF
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
    });
  }

  async function applyDiff() {
    if (!diff?.after) return;

    setCode(diff.after);
    await save(diff.after);
    setDiff(null);
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

      {/* FILETREE */}
      <div style={{
        width: 220,
        borderRight: "1px solid #222",
        overflow: "auto",
        background: "#f3f3f3"
      }}>
        {files.map(f => (
          <div
            key={f}
            onClick={() => setActive(f)}
            style={{
              padding: 8,
              cursor: "pointer",
              background: active === f ? "#ddd" : "transparent"
            }}
          >
            {f}
          </div>
        ))}
      </div>

      {/* CENTER */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        minHeight: 0
      }}>

        {/* EDITOR */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <Monaco
            theme="vs-dark"
            language="typescript"
            value={code}
            onChange={v => setCode(v || "")}
          />
        </div>

        {/* CONTROLS */}
        <div style={{
          padding: 8,
          borderTop: "1px solid #222",
          background: "#111",
          color: "#fff"
        }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => save()}>SAVE</button>

            <input
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Ask AI..."
              style={{ flex: 1 }}
            />

            <button onClick={runDiff}>DIFF</button>
          </div>

          <div style={{ marginTop: 6 }}>VERSION {version}</div>
        </div>

        {/* 🔥 SIDE-BY-SIDE DIFF */}
        {diff && (
          <div style={{
            height: 220,
            display: "flex",
            borderTop: "1px solid #222"
          }}>
            {/* BEFORE */}
            <div style={{
              flex: 1,
              background: "#1e1e1e",
              color: "#ff6b6b",
              overflow: "auto",
              padding: 6,
              borderRight: "1px solid #333"
            }}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>BEFORE</div>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {diff.before}
              </pre>
            </div>

            {/* AFTER */}
            <div style={{
              flex: 1,
              background: "#111",
              color: "#0f0",
              overflow: "auto",
              padding: 6
            }}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>AFTER</div>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {diff.after}
              </pre>
            </div>

            {/* APPLY */}
            <div style={{
              width: 120,
              borderLeft: "1px solid #222",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#111"
            }}>
              <button
                onClick={applyDiff}
                style={{
                  background: "#ff6b00",
                  color: "#fff",
                  border: "none",
                  padding: "8px 14px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                APPLY
              </button>
            </div>
          </div>
        )}

        {/* JOURNAL */}
        <div style={{
          height: 150,
          overflow: "auto",
          background: "#000",
          color: "#0f0",
          fontSize: 12,
          padding: 6,
          borderTop: "1px solid #222"
        }}>
          {journal.map((e, i) => (
            <div key={i}>
              {new Date(e.t).toLocaleTimeString()} → {e.op} → {e.path}
            </div>
          ))}
        </div>

      </div>

      {/* PREVIEW */}
      <div style={{
        width: 600,
        borderLeft: "1px solid #222",
        background: "#fff"
      }}>
        <iframe
          key={version}
          src={`/api/dev/preview?projectId=${projectId}&v=${version}`}
          style={{
            width: "100%",
            height: "100%",
            border: "none"
          }}
        />
      </div>

    </div>
  );
}
