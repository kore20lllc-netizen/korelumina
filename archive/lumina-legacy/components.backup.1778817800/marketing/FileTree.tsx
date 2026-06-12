"use client";
import { useEffect, useState } from "react";


export default function FileTree({
  projectId,
  onSelectFile,
}: {
  projectId: string;
  onSelectFile: (path: string) => void;
}) {
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/dev/files?projectId=${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        const flatFiles = (data.files || []).filter(
          (f: string) => !f.endsWith("/")
        );
        setFiles(flatFiles);
      });
  }, [projectId]);

  return (
    <div className="text-sm space-y-1">
      {files.map((file) => (
        <button
          key={file}
          onClick={() => onSelectFile(file)}
          className="block w-full text-left px-2 py-1 hover:bg-muted rounded"
        >
          {file}
        </button>
      ))}
    </div>
  );
}
