export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

async function copyDir(src:string,dst:string){
  await fs.mkdir(dst,{ recursive:true })
  const entries = await fs.readdir(src,{ withFileTypes:true })

  for(const entry of entries){
    const from = path.join(src,entry.name)
    const to = path.join(dst,entry.name)

    if(entry.isDirectory()){
      await copyDir(from,to)
    }else{
      await fs.copyFile(from,to)
    }
  }
}

export async function POST(req:NextRequest){

  const body = await req.json()
  const { projectId, template } = body

  if(!projectId || !template){
    return NextResponse.json({ ok:false, error:"missing projectId or template" },{ status:400 })
  }

  const src = path.join(process.cwd(),"templates","websites",template)
  const dst = path.join(
    process.cwd(),
    ".kore_runtime",
    "workspaces",
    "default",
    "projects",
    projectId
  )

  try{
    await fs.access(src)
  }catch{
    return NextResponse.json({ ok:false, error:"template not found" },{ status:404 })
  }

  await fs.rm(dst,{ recursive:true, force:true })
  await copyDir(src,dst)

  return NextResponse.json({ ok:true, projectId, template })
}
