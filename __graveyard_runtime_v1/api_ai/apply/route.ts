import { NextResponse } from "next/server"
import path from "path"
import { applyWithGuard } from "@/lib/ai/apply-guard"

export const dynamic = "force-dynamic"

export async function POST(req:Request){

  const body = await req.json()

  const {workspaceId,projectId,files} = body

  if(!workspaceId || !projectId || !files){
    return NextResponse.json({error:"invalid input"},{status:400})
  }

  const projectRoot = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    workspaceId,
    "projects",
    projectId
  )

  const result = applyWithGuard(projectRoot,files)

  return NextResponse.json(result)
}
