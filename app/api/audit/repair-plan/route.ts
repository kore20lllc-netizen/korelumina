import { NextResponse } from "next/server";
import { runRepoAudit } from "@/lib/audit/engine";
import { buildRepairPlan } from "@/lib/audit/repair-plan";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const projectId = body?.projectId;

    if (!projectId) {
      return NextResponse.json(
        {
          ok: false,
          error: "projectId is required",
        },
        { status: 400 }
      );
    }

    const report = await runRepoAudit(
      projectId,
      "deep"
    );

    const steps = buildRepairPlan(report);

    return NextResponse.json({
      ok: true,
      steps,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate repair plan",
      },
      { status: 500 }
    );
  }
}
