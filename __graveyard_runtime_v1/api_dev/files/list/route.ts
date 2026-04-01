import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function GET(req:NextRequest){

  const { searchParams } = new URL(req.url)

  const projectId = searchParams.get("projectId")

  if(!projectId){
    return NextResponse.json({ ok:false })
  }

  const root = path.join(
    process.cwd(),
    ".kore_runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    "app"
  )

  async function walk(dir:string, base=""){

    const items = await fs.readdir(dir,{ withFileTypes:true })

    let files:string[] = []

    for(const item of items){

      const full = path.join(dir,item.name)
      const rel = path.join(base,item.name)

      if(item.isDirectory()){
        files = files.concat(await walk(full,rel))
      }else{
        files.push(rel)
      }

    }

    return files
  }

  try{
    const files = await walk(root)

    return NextResponse.json({
      ok:true,
      files
    })
  }catch{
    return NextResponse.json({ ok:false })
  }

}
