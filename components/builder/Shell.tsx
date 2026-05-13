"use client";

import { useState } from "react";

import FileTree from "@/components/builder/FileTree";
import CodeEditor from "@/components/builder/CodeEditor";
import PreviewFrame from "@/components/builder/PreviewFrame";
import DiffPanel from "@/components/builder/DiffPanel";

type Props = {
  workspaceId?: string;
  projectId: string;
};

type DiffItem = {
  file: string;
  content: string;
};

export default function Shell({
  workspaceId = "default",
  projectId,
}: Props) {
  const [selectedFile, setSelectedFile] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  // Placeholder until AI draft generation is wired in.
  // DiffPanel expects items with: { file, content }.
  const drafts: DiffItem[] = [];

  function applyChange() {
    setRefreshTick((prev) => prev + 1);
  }

  return (
    <div
      className="grid h-screen"
      style={{
        gridTemplateColumns: "280px 1fr 1fr 420px",
      }}
    >
      <div style={{ borderRight: "1px solid #ddd" }}>
        <FileTree
          workspaceId={workspaceId}
          projectId={projectId}
          refreshTick={refreshTick}
          onSelect={setSelectedFile}
        />
      </div>

      <div style={{ borderRight: "1px solid #ddd" }}>
        <CodeEditor
          projectId={projectId}
          path={selectedFile}
          onSaved={applyChange}
        />
      </div>

      <div style={{ borderRight: "1px solid #ddd" }}>
        <PreviewFrame
          projectId={projectId}
          refreshTick={refreshTick}
        />
      </div>

      <div>
        <DiffPanel
          drafts={drafts}
          onApply={applyChange}
        />
      </div>
    </div>
  );
}
