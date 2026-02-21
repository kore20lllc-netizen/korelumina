"use client";

import { useEffect, useState } from "react";

export default function LogPanel({
  workspaceId,
  projectId,
}: {
  workspaceId: string;
  projectId: string;
}) {
  const [logs, setLogs] = useState<string>("");

  useEffect(() => {
    const es = new EventSource(
      `/api/workspaces/${workspaceId}/projects/${projectId}/events`
    );

    const append = (text: string) => setLogs((prev) => prev + text);

    es.addEventListener("build", (e: MessageEvent) => {
      append(String(e.data ?? ""));
    });

    es.addEventListener("preview", (e: MessageEvent) => {
      append(String(e.data ?? ""));
    });

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [workspaceId, projectId]);

  return (
    <div className="h-64 w-full overflow-auto rounded-md border bg-black p-3 font-mono text-sm whitespace-pre-wrap text-green-400">
      {logs || "Waiting for logs..."}
    </div>
  );
}
