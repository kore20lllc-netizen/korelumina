import { NextResponse } from "next/server";
import { enforceDevOnly } from "@/lib/dev-guard";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    enforceDevOnly();

    const { projectId } = await params;

    return NextResponse.json({
      ok: true,
      message: "Deploy stub executed",
      projectId
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 403 }
    );
  }
}
