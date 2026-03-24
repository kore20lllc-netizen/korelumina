import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function GET(req: NextRequest){

  const { searchParams } = new URL(req.url)

  const projectId = searchParams.get("projectId")

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

  let files:string[] = []

  try{
    files = await fs.readdir(root)
  }catch{
    return new NextResponse(
      "<div style='padding:40;font-family:sans-serif'>No runtime app</div>",
      { headers:{ "content-type":"text/html" } }
    )
  }

  const pages = files.filter(f => f.endsWith(".tsx"))

  const list = pages.map(f=>{
    return `<li>${f}</li>`
  }).join("")

  const html = `
  <!doctype html>
  <html>
  <body style="font-family:sans-serif;padding:30px">
    <h2>Runtime Preview</h2>
    <div>Files in runtime:</div>
    <ul>${list}</ul>
  </body>
  </html>
  `

  return new NextResponse(
    html,
    {
      headers:{
        "content-type":"text/html"
      }
    }
  )

}
