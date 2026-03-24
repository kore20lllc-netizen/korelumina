import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function GET(req: NextRequest){

  const projectId = req.nextUrl.searchParams.get("projectId")

  if(!projectId){
    return NextResponse.json({ ok:false })
  }

  const root = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    "app"
  )

  try{

    const files = await fs.readdir(root)

    return NextResponse.json({
      ok:true,
      files
    })

  }catch{

    return NextResponse.json({
      ok:true,
      files:[]
    })

  }

}
