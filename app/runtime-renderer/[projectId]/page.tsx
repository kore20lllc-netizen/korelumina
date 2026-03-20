import path from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function Page({ params }: any){

  const { projectId } = await params

  const { render } = await import("../../../runtime-exec/render.js")

  const bundle = await render(projectId)

  const code = require("fs").readFileSync(bundle,"utf8")

  return (
    <html>
      <body>
        <div id="root"></div>

        <script dangerouslySetInnerHTML={{
          __html: code + `
            const root = document.getElementById("root")
            root.innerHTML = "RUNTIME EXEC OK"
          `
        }} />

      </body>
    </html>
  )
}
