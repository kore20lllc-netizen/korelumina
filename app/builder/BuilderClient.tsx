"use client";

import BuilderInner from "./BuilderInner";
import { useSearchParams } from "next/navigation";

export default function BuilderClient() {
  const searchParams = useSearchParams();

  const projectId =
    searchParams.get("projectId") ||
    "demo-project";

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#000",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          zIndex: 999999,
          background: "lime",
          color: "#000",
          padding: 20,
          fontSize: 24,
          fontWeight: 700,
        }}
      >
        BUILDER CLIENT LIVE
      </div>

      <BuilderInner
        projectId={projectId}
      />
    </div>
  );
}
