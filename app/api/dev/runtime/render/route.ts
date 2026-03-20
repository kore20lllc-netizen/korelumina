export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import path from "path"
import { spawn } from "child_process"

export async function GET(req: NextRequest){

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")

  if(!projectId){
    return new NextResponse("missing projectId",{ status:400 })
  }

  const executor = path.join(process.cwd(),"runtime-executor.js")

  return await new Promise<Response>((resolve)=>{

    const child = spawn("node",[executor,projectId])

    let out = ""
    let err = ""

    child.stdout.on("data",(d)=> out += d.toString())
    child.stderr.on("data",(d)=> err += d.toString())

    child.on("close",()=>{

      if(err){
        resolve(new NextResponse(err,{ status:500 }))
        return
      }

      resolve(new NextResponse(out,{
        headers:{ "content-type":"text/html" }
      }))
    })
  })
}
