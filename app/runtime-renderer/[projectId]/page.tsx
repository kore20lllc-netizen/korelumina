"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function RuntimeRenderer() {
  const params = useParams();
  const projectId =
    typeof params?.projectId === "string"
      ? params.projectId
      : Array.isArray(params?.projectId)
      ? params.projectId[0]
      : "korelumina-dogfood";

  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/dev/fs/list?projectId=${encodeURIComponent(projectId)}`
        );
        const data = await res.json();

        if (data?.files && Array.isArray(data.files)) {
          setFiles(data.files);
        }
      } catch (error) {
        console.error("Runtime renderer failed:", error);
      }
    }

    load();
  }, [projectId]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">
        Runtime Renderer: {projectId}
      </h1>

      <div className="space-y-1 text-sm font-mono">
        {files.map((file) => (
          <div key={file}>{file}</div>
        ))}
      </div>
    </div>
  );
}
