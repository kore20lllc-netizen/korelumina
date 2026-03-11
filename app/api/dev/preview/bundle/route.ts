import fs from "fs"
import path from "path"
import { NextResponse } from "next/server"

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")

  if (!projectId) {
    return NextResponse.json({ error: "missing projectId" }, { status: 400 })
  }

  const projectRoot = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId
  )

  const entry = path.join(projectRoot,"app","page.tsx")

  if (!fs.existsSync(entry)) {
    return NextResponse.json({
      error: "project entry not found",
      path: entry
    })
  }

  const source = fs.readFileSync(entry,"utf8")

  const titleMatch = source.match(/<h1>(.*?)<\/h1>/)
  const textMatch = source.match(/<p>(.*?)<\/p>/)

  const title = titleMatch ? titleMatch[1] : "Preview"
  const text = textMatch ? textMatch[1] : ""

  const html = `
<html>
<body style="font-family:sans-serif;padding:40px">
<h1>${title}</h1>
<p>${text}</p>
</body>
</html>
`

  return new NextResponse(html,{
    headers:{ "Content-Type":"text/html" }
  })
}
