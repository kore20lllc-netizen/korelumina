"use client";

import { useSearchParams } from "next/navigation";

export default function PreviewClient() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return <div className="p-6">No project selected</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold">Preview</h1>
      <p className="text-sm text-muted-foreground">
        Project: {projectId}
      </p>
    </div>
  );
}
