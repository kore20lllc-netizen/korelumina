"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  workspaceId: string;
  projectId: string;
};

export default function LogPanel({ workspaceId, projectId }: Props) {
  const [logs, setLogs] = useState<string>("");
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const es = new EventSource(
      `/api/workspaces/${workspaceId}/projects/${projectId}/events`
    );

    es.onmessage = (e) => {
      setLogs((prev) => prev + e.data + "\n");
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [workspaceId, projectId]);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="border rounded bg-black text-green-400 text-sm h-96 overflow-hidden">
      <pre
        ref={ref}
        className="p-4 overflow-auto h-full whitespace-pre-wrap"
      >
        {logs || "Waiting for logs..."}
      </pre>
    </div>
  );
}
