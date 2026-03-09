"use client";

import ReactDiffViewer from "react-diff-viewer-continued";

export default function DiffViewer({
  oldText,
  newText,
  file,
}: {
  oldText: string;
  newText: string;
  file: string;
}) {
  return (
    <div style={{ marginBottom: 30 }}>
      <h3>{file}</h3>

      <ReactDiffViewer
        oldValue={oldText}
        newValue={newText}
        splitView={true}
      />
    </div>
  );
}
