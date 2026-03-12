"use client";
import { useEffect, useState } from "react";

import Editor from "@monaco-editor/react";

export default function CodeEditor({ projectId, path }: any) {
  const [code, setCode] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/dev/files/read?projectId=${projectId}&path=${path}`);
      const json = await res.json();
      setCode(json.content || "");
    }
    load();
  }, [projectId, path]);

  async function save(value: string | undefined) {
    setCode(value || "");

    await fetch("/api/dev/files/write", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        path,
        content: value
      })
    });
  }

  return (
    <Editor
      height="100%"
      defaultLanguage="typescript"
      value={code}
      onChange={save}
      theme="vs-dark"
    />
  );
}
