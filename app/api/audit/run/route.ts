import { NextResponse } from "next/server";
import { runRepoAudit } from "@/lib/audit/engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const source = body?.source;
    const mode =
      body?.mode === "deep"
        ? "deep"
        : "scan";

    const projectId =
      typeof source === "string"
        ? source
        : source?.kind === "project"
        ? source.projectId
        : null;

    if (!projectId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Only project audits are supported.",
        },
        { status: 400 }
      );
    }

    const report = await runRepoAudit(
      projectId,
      mode
    );

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Audit failed",
      },
      { status: 500 }
    );
  }
}
