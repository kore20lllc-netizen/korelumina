import { NextRequest } from "next/server"
import { getVersion } from "@/runtime/version/store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const wait = (ms:number)=> new Promise(r=>setTimeout(r,ms))

export async function GET(req: NextRequest){

  const projectId = req.nextUrl.searchParams.get("projectId") || "demo-project"

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller){

      let lastVersion = -1

      while (!req.signal.aborted) {
        const currentVersion = getVersion(projectId)

        if (currentVersion !== lastVersion) {
          lastVersion = currentVersion
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ version: currentVersion })}\n\n`)
          )
        }

        await wait(1000)
      }

      controller.close()
    }
  })

  return new Response(stream,{
    headers:{
      "Content-Type":"text/event-stream",
      "Cache-Control":"no-cache, no-transform",
      "Connection":"keep-alive"
    }
  })
}
