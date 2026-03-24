import { NextRequest, NextResponse } from "next/server"
import { getVersion } from "@/runtime/version/store"

export async function GET(req:NextRequest){

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId") || ""

  return NextResponse.json({
    ok:true,
    version:getVersion(projectId)
  })

}
