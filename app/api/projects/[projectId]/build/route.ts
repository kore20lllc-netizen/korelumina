import { NextResponse } from "next/server";
import { startBuild } from "@/lib/build-executor";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  // 🔒 Production Guard
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_RUNTIME_BUILDS !== "true"
  ) {
    return NextResponse.json(
      { error: "Runtime builds disabled in production" },
      { status: 403 }
    );
  }

  try {
    const job = await startBuild(projectId);
    return NextResponse.json({ ok: true, projectId, jobId: job.id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Build failed" },
      { status: 500 }
    );
  }
}
