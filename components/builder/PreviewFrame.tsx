"use client";

import { useEffect, useRef } from "react";

export default function PreviewFrame({
  projectId,
  file,
  version,
}: {
  projectId: string;
  file?: string;
  version?: number;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const src = `http://127.0.0.1:5173/__preview_bundle?projectId=${projectId}&entry=${encodeURIComponent(
    file || "app/page.tsx"
  )}&v=${version || 0}`;

  // 🔥 listen for refresh event
  useEffect(() => {
    const handler = () => {
      if (!iframeRef.current) return;

      iframeRef.current.src =
        `http://127.0.0.1:5173/__preview_bundle?projectId=${projectId}` +
        `&entry=${encodeURIComponent(file || "app/page.tsx")}` +
        `&v=${Date.now()}`; // force reload
    };

    window.addEventListener("kore-refresh-preview", handler);

    return () => {
      window.removeEventListener("kore-refresh-preview", handler);
    };
  }, [projectId, file]);

  return (
    <iframe
      ref={iframeRef}
      src={src}
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        background: "#fff",
      }}
    />
  );
}
