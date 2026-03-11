"use client";

import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";

export default function CodeEditor({
  projectId,
  filePath,
  value,
  onChange,
}: {
  projectId: string;
  filePath: string | null;
  value: string;
  onChange: (v: string) => void;
}) {
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!filePath) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      fetch("/api/dev/files/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          path: filePath,
          content: value,
        }),
      }).then(() => {
        if (typeof window !== "undefined") {
          window.postMessage("preview:refresh", "*");
        }
      });
    }, 300);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [value, filePath, projectId]);

  return (
    <Editor
      height="100%"
      defaultLanguage="typescript"
      value={value}
      onChange={(v) => onChange(v ?? "")}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
      }}
    />
  );
}
