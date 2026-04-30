"use client";

import { useSearchParams } from "next/navigation";

export default function BuilderClient() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "demo-project";

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <iframe
        src="http://localhost:8080"
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
}
