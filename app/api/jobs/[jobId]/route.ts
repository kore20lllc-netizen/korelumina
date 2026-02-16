import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

function getJobFile(jobId: string) {
  return path.join(process.cwd(), "runtime", "jobs", `${jobId}.json`);
}

export async function GET(_req: Request, context: RouteContext) {
  const { jobId } = await context.params;

  const jobFile = getJobFile(jobId);
  if (!fs.existsSync(jobFile)) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const raw = fs.readFileSync(jobFile, "utf-8");
  const job = JSON.parse(raw);

  return NextResponse.json(job, { status: 200 });
}
