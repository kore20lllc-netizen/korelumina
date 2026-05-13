import { NextRequest, NextResponse } from "next/server";
import { readJournal } from "@/lib/ai/journal";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;

  const workspaceId =
    url.searchParams.get("workspaceId") || "";

  const projectId =
    url.searchParams.get("projectId") || "";

  const limitRaw =
    url.searchParams.get("limit") || "200";

  const limit =
    Number(limitRaw);

  const result =
    await readJournal(
      workspaceId,
      projectId,
      Number.isFinite(limit)
        ? limit
        : 200,
    );

  return NextResponse.json({
    ok: true,
    entries: result,
  });
}
