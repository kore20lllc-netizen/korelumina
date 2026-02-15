"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

export default function BuilderPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [logs, setLogs] = useState<string[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const eventSourceRef = useRef<EventSource | null>(null);

  async function startBuild() {
    setLogs([]);
    setStatus("starting");

    const res = await fetch(`/api/projects/${projectId}/build`, {
      method: "POST",
    });

    const data = await res.json();
    setJobId(data.jobId);
    setStatus("streaming");
  }

  useEffect(() => {
    if (!jobId) return;

    const es = new EventSource(`/api/jobs/${jobId}/stream`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      const payload = JSON.parse(event.data);

      if (payload.log) {
        setLogs((prev) => [...prev, payload.log]);
      }

      if (payload.status === "completed") {
        setStatus("completed");
        es.close();
      }

      if (payload.status === "failed") {
        setStatus("failed");
        es.close();
      }
    };

    es.onerror = () => {
      setStatus("connection-lost");
      es.close();
    };

    return () => {
      es.close();
    };
  }, [jobId]);

  return (
    <div className="h-screen w-screen flex flex-col bg-black text-green-400 font-mono text-sm">
      <div className="p-4 border-b border-gray-800 flex justify-between">
        <div>Project: {projectId}</div>
        <button
          onClick={startBuild}
          className="bg-green-600 px-3 py-1 rounded text-black"
        >
          Start Build
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>

      <div className="p-2 border-t border-gray-800 text-xs">
        Status: {status}
      </div>
    </div>
  );
}
