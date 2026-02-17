import { NextResponse } from "next/server";
import path from "path";
import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";
import { createJob } from "../../../../runtime/job-store";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;

  try {
    const projectRoot = resolveWorkspacePath(projectId);
    assertProjectExists(projectRoot);

    const job = createJob(projectId);

    return NextResponse.json({
      ok: true,
      projectId,
      jobId: job.id,
      root: projectRoot
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Build failed" },
      { status: 400 }
    );
  }
}
EOFcat > app/api/projects/[projectId]/build/route.ts << 'EOF'
import { NextResponse } from "next/server";
import path from "path";
import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";
import { createJob } from "../../../../runtime/job-store";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;

  try {
    const projectRoot = resolveWorkspacePath(projectId);
    assertProjectExists(projectRoot);

    const job = createJob(projectId);

    return NextResponse.json({
      ok: true,
      projectId,
      jobId: job.id,
      root: projectRoot
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Build failed" },
      { status: 400 }
    );
  }
}
