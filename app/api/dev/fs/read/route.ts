import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function GET(req: NextRequest){

  const projectId = req.nextUrl.searchParams.get("projectId")
  const file = req.nextUrl.searchParams.get("file")

  if(!projectId || !file){
    return NextResponse.json({ ok:false })
  }

  const full = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    "app",
    file
  )

  try{

    const content = await fs.readFile(full,"utf8")

    return NextResponse.json({
      ok:true,
      content
    })

  }catch{

    return NextResponse.json({
      ok:false
    })

  }

}
