"use client";

import { useSearchParams } from "next/navigation";

export default function PreviewClient() {

  const params = useSearchParams();
  const projectId = params.get("projectId");

  if (!projectId) {
    return <div style={{padding:40}}>Missing projectId</div>;
  }

  return (
    <iframe
      src={`/api/dev/preview/bundle?projectId=${encodeURIComponent(projectId)}`}
      style={{
        border: "none",
        width: "100vw",
        height: "100vh",
        background: "white"
      }}
    />
  );
}
