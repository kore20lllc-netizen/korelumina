import { NextResponse } from "next/server";
import { previewdStart } from "@/lib/previewd-client";

type Ctx = {
  params: Promise<{ workspaceId: string; projectId: string }>;
};

export async function POST(_req: Request, context: Ctx) {
  // Preview daemon is LOCAL/dev only. Never attempt in production serverless.
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Preview not available in production" }, { status: 501 });
  }

  const { workspaceId, projectId } = await context.params;

  const res = await previewdStart(workspaceId, projectId);
  return NextResponse.json(res.json, { status: res.ok ? 200 : (res.status || 500) });
}
