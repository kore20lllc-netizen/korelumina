"use client";

import { useEffect, useState } from "react";

export default function FileTree({
  projectId,
  onSelect,
}: {
  projectId: string;
  onSelect: (p: string) => void;
}) {
  const [files, setFiles] = useState<string[]>([]);

  async function loadFiles() {
    const r = await fetch(`/api/dev/files?projectId=${projectId}`, {
      cache: "no-store",
    });
    const d = await r.json();
    setFiles(d.files || []);
  }

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  useEffect(() => {
    const reload = () => {
      console.log("FileTree reload");
      loadFiles();
    };

    window.addEventListener("korelumina:fs-change", reload);

    return () =>
      window.removeEventListener("korelumina:fs-change", reload);
  }, [projectId]);

  return (
    <div>
      {files.map((f) => (
        <div
          key={f}
          style={{
            cursor: "pointer",
            fontFamily: "monospace",
            padding: 4,
          }}
          onClick={() => onSelect(f)}
        >
          {f}
        </div>
      ))}
    </div>
  );
}
