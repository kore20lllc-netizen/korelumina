import { NextRequest, NextResponse } from "next/server"
import { getIntentState } from "@/runtime/intent/state"
import { resolveWorkspace } from "@/runtime/intent/router"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest){

  const projectId =
    req.nextUrl.searchParams.get("projectId") ||
    "demo-project"

  const intent = await getIntentState(projectId)

  const workspace = await resolveWorkspace(projectId)

  return NextResponse.json({
    ok: true,
    intent,
    workspace
  })
}
