"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });

function unwrap(input: any): string {
  let s = typeof input === "string" ? input : "";

  for (let i = 0; i < 5; i++) {
    try {
      const p = JSON.parse(s);
      if (p?.content) {
        s = p.content;
        continue;
      }
    } catch {}
    break;
  }

  return s
    .replace(/^```[a-z]*\n?/i, "")
    .replace(/```$/, "")
    .trim();
}

export default function BuilderPage() {
  const projectId = "demo-project";

  const [files, setFiles] = useState<string[]>([]);
  const [active, setActive] = useState("app/page.tsx");
  const [code, setCode] = useState("");
  const [version, setVersion] = useState(0);
  const [journal, setJournal] = useState<any[]>([]);

  const booted = useRef(false);

  function loadFiles() {
    fetch(`/api/dev/fs/list?projectId=${projectId}`)
      .then(r => r.json())
      .then(d => {
        const list = (d.files || []).map((f: string) =>
          f.startsWith("app/") ? f : "app/" + f
        );
        setFiles(list);
      });
  }

  function loadFile(file: string) {
    fetch(`/api/dev/fs/read?projectId=${projectId}&file=${encodeURIComponent(file)}`)
      .then(r => r.text()) // 🔥 RAW TEXT NOW
      .then(txt => setCode(unwrap(txt)));
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
    loadFile("app/page.tsx");
    loadJournal();
  }, []);

  useEffect(() => {
    if (!active) return;
    loadFile(active);
  }, [active]);

  async function handleSave() {
    const clean = unwrap(code);

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

    // 🔥 refresh journal AFTER save
    loadJournal();
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* FILE TREE */}
      <div style={{ width: 220, borderRight: "1px solid #333" }}>
        {files.map(f => (
          <div key={f} onClick={() => setActive(f)} style={{ padding: 8 }}>
            {f}
          </div>
        ))}
      </div>

      {/* EDITOR */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1 }}>
          <Monaco
            theme="vs-dark"
            language="typescript"
            value={code}
            onChange={v => setCode(v || "")}
          />
        </div>

        <button onClick={handleSave}>SAVE</button>
        <div>VERSION {version}</div>

        {/* 🔥 JOURNAL PANEL */}
        <div style={{ height: 150, overflow: "auto", background: "#111", color: "#fff", padding: 8 }}>
          {journal.length === 0 && <div>No journal entries</div>}
          {journal.map((e, i) => (
            <div key={i}>
              {new Date(e.t).toLocaleTimeString()} → {e.op} → {e.path}
            </div>
          ))}
        </div>
      </div>

      {/* PREVIEW */}
      <div style={{ width: 520 }}>
        <iframe
          key={version}
          src={`/api/dev/preview?projectId=${projectId}&v=${version}`}
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      </div>
    </div>
  );
}
