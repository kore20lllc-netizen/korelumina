import { NextResponse } from "next/server";
import { getJob } from "@/runtime/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const job = await getJob(params.jobId);
    return NextResponse.json(job, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Job not found" },
      { status: 404 }
    );
  }
}
