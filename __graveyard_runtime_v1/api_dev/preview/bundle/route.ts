import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  const instance = searchParams.get("instance")
  const seq = searchParams.get("seq")
  const reason = searchParams.get("reason")

  console.log("[preview/bundle]", {
    t: Date.now(),
    projectId,
    instance,
    seq,
    reason,
    referer: req.headers.get("referer"),
    secFetchDest: req.headers.get("sec-fetch-dest"),
    secFetchMode: req.headers.get("sec-fetch-mode"),
  })

  if (!projectId) {
    return new NextResponse("missing projectId", { status: 400 })
  }

  const file = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    "app",
    "page.tsx"
  )

  let source = ""

  try {
    source = await fs.readFile(file, "utf8")
  } catch {
    return new NextResponse("entry not found", { status: 404 })
  }

  const html = `
  <html>
  <body style="margin:0;font-family:system-ui">
    <pre style="padding:24px">LIVE PREVIEW

${source.replace(/</g,"&lt;")}
    </pre>
  </body>
  </html>
  `

  return new NextResponse(html,{
    headers:{ "Content-Type":"text/html" }
  })
}
