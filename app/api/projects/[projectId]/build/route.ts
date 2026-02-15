import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

import { createJob, updateJob } from "@/runtime/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getProjectRoot(id: string) {
  return path.join(process.cwd(), "projects", id);
}

export async function POST(
  _req: Request,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;
  const root = getProjectRoot(projectId);

  if (!fs.existsSync(root)) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  const jobId = randomUUID();

  // 1️⃣ Create DB job
  await createJob(jobId);

  // 2️⃣ Run async build (non-blocking)
  (async () => {
    try {
      await updateJob(jobId, { status: "running" });

      const child = spawn(
        "./scripts/build-project.sh",
        [projectId],
        {
          cwd: process.cwd(),
          shell: true,
        }
      );

      child.stdout.on("data", async (data) => {
        await updateJob(jobId, {
          status: "running"
        });
      });

      child.stderr.on("data", async (data) => {
        await updateJob(jobId, {
          status: "running"
        });
      });

      child.on("close", async (code) => {
        if (code === 0) {
          await updateJob(jobId, {
            status: "completed",
            result: { success: true }
          });
        } else {
          await updateJob(jobId, {
            status: "failed",
            error: `Build exited with code ${code}`
          });
        }
      });

    } catch (err: any) {
      await updateJob(jobId, {
        status: "failed",
        error: err?.message || "Build failed"
      });
    }
  })();

  // 3️⃣ Immediate response (non-blocking)
  return NextResponse.json({ jobId });
}
