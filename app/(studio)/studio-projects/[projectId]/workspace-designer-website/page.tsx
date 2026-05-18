"use client";

import { useParams, useRouter } from "next/navigation";

export default function DesignerWebsiteWorkspace() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();

  if (!params?.projectId) {
    return null;
  }

  const { projectId } = params;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          Website Designer Workspace
        </h1>
        <p className="mt-2 text-muted-foreground">
          Project ID: {projectId}
        </p>

        <div className="mt-8">
          <button
            type="button"
            onClick={() =>
              router.push(`/studio-projects/${projectId}`)
            }
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Back to Project
          </button>
        </div>
      </div>
    </div>
  );
}
