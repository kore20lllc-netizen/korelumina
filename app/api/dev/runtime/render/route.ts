import { NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"

export async function GET(req: Request){

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")

  if(!projectId){
    return NextResponse.json({ ok:false, error:"missing projectId" })
  }

  const projectRoot = path.join(
    process.cwd(),
    ".kore_runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    "app"
  )

  try{
    await fs.access(projectRoot)
  }catch{
    return NextResponse.json({ ok:false, error:"project not found" })
  }

  return NextResponse.json({
    ok:true,
    previewUrl: `/runtime-renderer/${projectId}`
  })
}
