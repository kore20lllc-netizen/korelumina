import { NextResponse } from "next/server";
import { runRepoAudit } from "@/lib/audit/engine";
import { generateAutoFixDrafts } from "@/lib/audit/auto-fix";

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

    const report =
      body?.report ??
      (await runRepoAudit(projectId, "deep"));

    const drafts = await generateAutoFixDrafts(
      projectId,
      report
    );

    return NextResponse.json({
      ok: true,
      drafts,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Auto fix failed",
      },
      { status: 500 }
    );
  }
}
