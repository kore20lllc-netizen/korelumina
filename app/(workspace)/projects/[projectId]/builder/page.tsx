"use client";

import { use } from "react";
import { useState } from "react";

type Health = "idle" | "running" | "stopped";

export default function BuilderPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const workspaceId = "default";

  const [health, setHealth] = useState<Health>("idle");

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">
        Builder – {projectId}
      </h1>
    </div>
  );
}
