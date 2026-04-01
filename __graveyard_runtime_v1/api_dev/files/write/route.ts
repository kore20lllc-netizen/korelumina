export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

function sanitize(content:any){

  if(typeof content !== "string") return ""

  // 🔥 AI sometimes returns JSON envelope
  if(content.trim().startsWith("{")){
    try{
      const j = JSON.parse(content)

      if(j.content) return j.content
      if(j.code) return j.code
      if(j.next) return j.next

    }catch{}
  }

  return content
}

export async function POST(req:NextRequest){

  const body = await req.json()

  const { projectId, file, content } = body

  const ROOT = path.join(
    process.cwd(),
    ".kore_runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    "app"
  )

  const full = path.join(ROOT, file)

  await fs.mkdir(path.dirname(full), { recursive:true })

  const safe = sanitize(content)

  await fs.writeFile(full, safe, "utf8")

  return NextResponse.json({ ok:true })
}
