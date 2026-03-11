"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import FileTree from "@/components/builder/FileTree";
import CodeEditor from "@/components/builder/CodeEditor";
import PreviewFrame from "@/components/builder/PreviewFrame";

export default function BuilderPage() {
  const params = useParams();
  const projectId = params?.projectId as string | undefined;

  const [file, setFile] = useState("app/page.tsx");

  if (!projectId) return null;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ width: 260, borderRight: "1px solid #ddd" }}>
        <FileTree projectId={projectId} onSelect={setFile} />
      </div>

      <div style={{ flex: 1 }}>
        <CodeEditor projectId={projectId} path={file} />
      </div>

      <div style={{ width: 420 }}>
        <PreviewFrame projectId={projectId} />
      </div>
    </div>
  );
}
