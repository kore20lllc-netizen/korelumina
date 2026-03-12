"use client";
import { useEffect, useState } from "react";


export default function JournalPanel({
  workspaceId,
  projectId,
}: {
  workspaceId: string;
  projectId: string;
}) {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(
        `/api/ai/journal?workspaceId=${workspaceId}&projectId=${projectId}`
      );

      const data = await res.json();
      setEvents(data.events ?? []);
    }

    load();
  }, [workspaceId, projectId]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Task Journal</h2>

      <pre
        style={{
          background: "#f6f6f6",
          padding: 20,
          overflow: "auto",
        }}
      >
        {JSON.stringify(events, null, 2)}
      </pre>
    </div>
  );
}
