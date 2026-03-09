"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";

export default function CodeEditor({
  workspaceId,
  projectId,
  file,
}: {
  workspaceId: string;
  projectId: string;
  file: string | null;
}) {
  const [code, setCode] = useState("");

  useEffect(() => {
    async function load() {
      if (!file) return;

      const res = await fetch(
        `/api/file?workspaceId=${workspaceId}&projectId=${projectId}&path=${file}`
      );

      const text = await res.text();
      setCode(text);
    }

    load();
  }, [file]);

  if (!file) {
    return <div style={{ padding: 20 }}>Select a file</div>;
  }

  return (
    <div style={{ height: "100%" }}>
      <Editor
        height="100%"
        language="typescript"
        value={code}
        onChange={(v) => setCode(v || "")}
      />
    </div>
  );
}
