"use client";

import { useEffect, useState } from "react";

export default function PreviewFrame({
  projectId,
}: {
  projectId: string;
}) {
  const [src, setSrc] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        setError("");

        const res = await fetch(
          `/api/dev/preview?projectId=${projectId}`,
          { cache: "no-store" },
        );

        const data = await res.json();

        if (!mounted) return;

        if (!data?.ok || !data?.url) {
          setError(data?.error || "Preview failed");
          return;
        }

        setSrc(data.url);
      } catch (err) {
        console.error("[PreviewFrame]", err);

        if (!mounted) return;

        setError("Failed to connect to preview");
      }
    }

    boot();

    return () => {
      mounted = false;
    };
  }, [projectId]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 600,
        background: "#000",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 28,
          display: "flex",
          alignItems: "center",
          padding: "0 10px",
          fontSize: 11,
          color: error ? "#f87171" : "#94a3b8",
          background: "#020617",
          borderBottom: "1px solid #1e293b",
          fontFamily: "monospace",
        }}
      >
        {error || src || "Starting preview..."}
      </div>

      {src && !error ? (
        <iframe
          src={src}
          title={`${projectId} preview`}
          style={{
            display: "block",
            width: "100%",
            height: "calc(100% - 28px)",
            minHeight: 572,
            border: 0,
            background: "#fff",
          }}
          allow="clipboard-read; clipboard-write"
        />
      ) : null}
    </div>
  );
}
