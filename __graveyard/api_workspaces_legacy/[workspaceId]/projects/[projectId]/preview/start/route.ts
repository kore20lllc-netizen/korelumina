import { NextRequest, NextResponse } from "next/server";
import { previewdStart } from "@/lib/previewd-client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  const { workspaceId, projectId } = await params;

  // 🚫 Never allow previewd in production/serverless
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Preview not available in production environment" },
      { status: 403 }
    );
  }

  try {
    const result = await previewdStart(workspaceId, projectId);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Preview start failed" },
      { status: 500 }
    );
  }
}
