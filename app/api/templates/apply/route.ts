import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function runtimeProjectRoot(projectId:string){
  return path.join(
    process.cwd(),
    ".kore_runtime",
    "workspaces",
    "default",
    "projects",
    projectId
  )
}

async function copyDir(src:string, dest:string){
  await fs.mkdir(dest,{recursive:true})
  const entries = await fs.readdir(src,{withFileTypes:true})

  for(const entry of entries){
    const s = path.join(src,entry.name)
    const d = path.join(dest,entry.name)

    if(entry.isDirectory()){
      await copyDir(s,d)
    }else{
      await fs.copyFile(s,d)
    }
  }
}

export async function POST(req:NextRequest){

  const body = await req.json()

  const projectId = body.projectId
  const templatePath = body.templatePath

  if(!projectId || !templatePath){
    return NextResponse.json({ok:false,error:"missing params"})
  }

  const templateAbs = path.join(process.cwd(),templatePath)

  const runtimeRoot = runtimeProjectRoot(projectId)
  const runtimeApp = path.join(runtimeRoot,"app")

  await fs.mkdir(runtimeApp,{recursive:true})

  const entries = await fs.readdir(templateAbs,{withFileTypes:true})

  const hasAppFolder = entries.some(e=>e.isDirectory() && e.name==="app")

  if(hasAppFolder){

    // copy CONTENT of template/app → runtime/app
    await copyDir(
      path.join(templateAbs,"app"),
      runtimeApp
    )

  }else{

    // copy template root → runtime/app
    await copyDir(
      templateAbs,
      runtimeApp
    )

  }

  return NextResponse.json({ok:true})
}
