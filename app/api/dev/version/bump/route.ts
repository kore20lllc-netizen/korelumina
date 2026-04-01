import { NextRequest, NextResponse } from "next/server"
import { bumpVersion } from "@/runtime/version/store"

export async function POST(req: NextRequest){
  const body = await req.json()
  const projectId = body.projectId || "demo-project"

  const version = bumpVersion(projectId)

  return NextResponse.json({
    ok: true,
    version
  })
}
