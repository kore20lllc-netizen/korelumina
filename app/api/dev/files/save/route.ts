import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function POST(req:NextRequest){

  const body = await req.json()

  const { projectId, file, content } = body

  if(!projectId || !file){
    return NextResponse.json({ ok:false })
  }

  const full = path.join(
    process.cwd(),
    ".kore_runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    "app",
    file
  )

  try{

    await fs.mkdir(path.dirname(full),{ recursive:true })

    await fs.writeFile(full,content,"utf8")

    return NextResponse.json({ ok:true })

  }catch(e){

    return NextResponse.json({ ok:false, error:String(e) })

  }

}
