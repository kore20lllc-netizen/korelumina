"use client";

import { useEffect, useState } from "react";

type Props = {
  projectId: string;
  onSelect?: (file: string) => void;
};

export default function FileTree({ projectId, onSelect }: Props) {
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(
        `/api/dev/fs/list?projectId=${projectId}`
      );
      const data = await res.json();
      setFiles(data.files || []);
    }

    load();
  }, [projectId]);

  function openFile(f: string) {
    onSelect?.(f);
  }

  return (
    <div style={{ padding: 10 }}>
      {files.map((f) => (
        <div
          key={f}
          onClick={() => openFile(f)}
          style={{
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: 4,
          }}
        >
          {f}
        </div>
      ))}
    </div>
  );
}
