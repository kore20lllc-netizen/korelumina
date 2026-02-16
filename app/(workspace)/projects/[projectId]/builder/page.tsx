"use client";

import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function BuilderPage({
  params,
}: {
  params: { projectId: string };
}) {
  const { projectId } = params;

  const [status, setStatus] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [polling, setPolling] = useState(false);

  const fetchStatus = async () => {
    const res = await fetch(`/api/projects/${projectId}/status`);
    const data = await res.json();
    setStatus(data);

    if (!data.running) {
      setPolling(false);
    }
  };

  const fetchLogs = async () => {
    const res = await fetch(`/api/projects/${projectId}/logs`);
    const data = await res.json();
    setLogs(data.logs || []);
  };

  const startBuild = async () => {
    await fetch(`/api/projects/${projectId}/build`, { method: "POST" });
    setPolling(true);
  };

  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
    }, 2000); // poll every 2 seconds

    return () => clearInterval(interval);
  }, [polling]);

  return (
    <div style={{ padding: 30 }}>
      <h2>Builder: {projectId}</h2>

      <button onClick={startBuild} style={{ marginTop: 10 }}>
        Start Build
      </button>

      <div style={{ marginTop: 20 }}>
        <strong>Status:</strong>
        <pre>{JSON.stringify(status, null, 2)}</pre>
      </div>

      <div style={{ marginTop: 20 }}>
        <strong>Logs:</strong>
        <pre style={{ background: "#111", color: "#0f0", padding: 10 }}>
          {logs.join("\n")}
        </pre>
      </div>
    </div>
  );
}
