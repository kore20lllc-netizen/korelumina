"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function Builder() {
  const projectId = "demo-project";

  const [files, setFiles] = useState<string[]>([]);
  const [active, setActive] = useState("app/page.tsx");
  const [code, setCode] = useState("");
  const [version, setVersion] = useState(0);
  const [journal, setJournal] = useState<any[]>([]);

  // load files
  useEffect(() => {
    fetch("/api/dev/fs/list?projectId=" + projectId)
      .then((r) => r.json())
      .then((d) => {
        const normalized = (d.files || []).map((f: string) =>
          f.startsWith("app/") ? f : "app/" + f
        );
        setFiles(normalized);
      });
  }, []);

  // load file
  useEffect(() => {
    fetch(
      "/api/dev/fs/read?projectId=" +
        projectId +
        "&file=" +
        active
    )
      .then((r) => r.text())
      .then(setCode);
  }, [active]);

  function loadJournal() {
    fetch("/api/dev/journal?projectId=" + projectId)
      .then((r) => r.json())
      .then((d) => setJournal(d.entries || []));
  }

  useEffect(loadJournal, []);

  async function save() {
    await fetch("/api/dev/fs/write", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectId,
        file: active,
        content: code,
      }),
    });

    setVersion((v) => v + 1);
    loadJournal();
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* FILE TREE */}
      <div style={{ width: 220, borderRight: "1px solid #333" }}>
        {files.map((f) => (
          <div
            key={f}
            onClick={() => setActive(f)}
            style={{ padding: 8, cursor: "pointer" }}
          >
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
        }}
      >
        <div style={{ flex: 1 }}>
          <Monaco
            theme="vs-dark"
            value={code}
            onChange={(v) => setCode(v || "")}
          />
        </div>

        <button
          onClick={save}
          style={{
            height: 40,
            background: "#0a84ff",
            color: "#fff",
            border: "none",
          }}
        >
          SAVE
        </button>

        <div
          style={{
            height: 140,
            overflow: "auto",
            background: "#111",
            color: "#fff",
            padding: 8,
          }}
        >
          {journal.map((e, i) => (
            <div key={i}>
              {e.op} → {e.path}
            </div>
          ))}
        </div>
      </div>

      {/* PREVIEW */}
      <div
        style={{
          width: 520,
          borderLeft: "1px solid #333",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: 10, background: "#000", color: "#fff" }}>
          VERSION {version}
        </div>

        <iframe
          src={
            "/api/dev/preview?projectId=" +
            projectId +
            "&v=" +
            version
          }
          style={{ flex: 1, border: "none", background: "#fff" }}
        />
      </div>
    </div>
  );
}
