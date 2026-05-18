"use client";

import { useEffect, useState } from "react";

export default function SnapshotPanel({
  onRestore,
  refreshKey,
}: {
  onRestore: () => void;
  refreshKey: number;
}) {
  const [snapshots, setSnapshots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadSnapshots() {
    try {
      setLoading(true);

      const res = await fetch("/api/dev/snapshot/list?projectId=repo-test");
      const data = await res.json();

      setSnapshots(Array.isArray(data.snapshots) ? data.snapshots : []);
    } catch (err) {
      console.error("Snapshot load failed:", err);
      setSnapshots([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(id: string) {
    try {
      await fetch("/api/dev/snapshot/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: "repo-test",
          snapshotId: id,
        }),
      });

      onRestore();
    } catch (err) {
      console.error("Restore failed:", err);
    }
  }

  // 🔥 reload when preview updates OR on mount
  useEffect(() => {
    loadSnapshots();
  }, [refreshKey]);

  return (
    <div
      style={{
        maxHeight: 160,
        overflow: "auto",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: 10,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Snapshots</div>

      {loading && (
        <div style={{ fontSize: 12, opacity: 0.6 }}>Loading...</div>
      )}

      {!loading && snapshots.length === 0 && (
        <div style={{ fontSize: 12, opacity: 0.6 }}>
          No snapshots yet
        </div>
      )}

      {snapshots.map((id) => (
        <div
          key={id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 12 }}>{id}</span>

          <button
            onClick={() => handleRestore(id)}
            style={{
              fontSize: 11,
              padding: "4px 8px",
              borderRadius: 6,
              border: "none",
              background: "#334155",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Restore
          </button>
        </div>
      ))}
    </div>
  );
}
