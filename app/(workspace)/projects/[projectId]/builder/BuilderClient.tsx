"use client";

import { useEffect, useState } from "react";

interface BuilderState {
  preview: {
    port: number;
    url: string;
  } | null;
  job: {
    status: string;
  } | null;
}

export default function BuilderClient({
  workspaceId,
  projectId,
}: {
  workspaceId: string;
  projectId: string;
}) {
  const [state, setState] = useState<BuilderState | null>(null);

  useEffect(() => {
    const es = new EventSource(
      `/api/workspaces/${workspaceId}/projects/${projectId}/stream`
    );

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setState(data);
      } catch {}
    };

    return () => {
      es.close();
    };
  }, [workspaceId, projectId]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b bg-muted">
        <div className="text-sm font-medium">
          {state?.job?.status === "running" && "🟡 Building..."}
          {state?.job?.status === "success" && "🟢 Build Successful"}
          {state?.job?.status === "failed" && "🔴 Build Failed"}
        </div>

        {state?.preview && (
          <a
            href={state.preview.url}
            target="_blank"
            className="text-sm underline"
          >
            Open Preview :{state.preview.port}
          </a>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 text-sm">
        Live builder state connected.
      </div>
    </div>
  );
}
