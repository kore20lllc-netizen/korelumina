import { NextResponse } from "next/server";
import { readJournal } from "@/lib/ai/journal";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId") || "";
  const projectId = url.searchParams.get("projectId") || "";
  const limitRaw = url.searchParams.get("limit") || "200";
  const limit = Math.max(1, Math.min(parseInt(limitRaw, 10) || 200, 2000));

  if (!workspaceId || !projectId) {
    return NextResponse.json(
      { error: "workspaceId and projectId are required" },
      { status: 400 }
    );
  }

  const events = readJournal(workspaceId, projectId, limit);
  return NextResponse.json({ ok: true, events });
}
