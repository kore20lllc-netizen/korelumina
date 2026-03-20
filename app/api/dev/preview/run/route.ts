import { NextRequest, NextResponse } from "next/server"
import path from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest){

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")

  if(!projectId){
    return new NextResponse("missing projectId",{ status:400 })
  }

  const entry = path.join(
    process.cwd(),
    ".kore_runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    "app",
    "page.tsx"
  )

  try{

    const esbuild = eval("require")("esbuild")

    const wrapper = `
      import App from ${JSON.stringify(entry)}
      window.__RUNTIME_APP__ = App
    `

    const result = await esbuild.build({
      stdin:{
        contents:wrapper,
        resolveDir:process.cwd(),
        loader:"ts"
      },
      bundle:true,
      write:false,
      format:"iife",
      platform:"browser",
      jsx:"automatic",
      resolveExtensions:[".tsx",".ts",".jsx",".js"],
      loader:{
        ".ts":"ts",
        ".tsx":"tsx",
        ".js":"js",
        ".jsx":"jsx"
      }
    })

    const js = result.outputFiles[0].text

    return new NextResponse(
`<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
</head>
<body style="margin:0;font-family:sans-serif;height:100vh;overflow:auto;background:white">
  <div id="root"></div>
  <script>
    try{
      ${js}
      const Root = window.__RUNTIME_APP__
      if(!Root){
        throw new Error("window.__RUNTIME_APP__ is undefined")
      }
      ReactDOM.createRoot(document.getElementById("root")).render(
        React.createElement(Root)
      )
    }catch(e){
      document.body.innerHTML =
        "<div style='padding:24px;font-family:monospace;color:#b00020'>" +
        "<h2>Runtime Render Failed</h2>" +
        "<pre>"+ String(e && e.stack ? e.stack : e) +"</pre>" +
        "</div>"
    }
  </script>
</body>
</html>`,
      { headers:{ "content-type":"text/html; charset=utf-8" } }
    )

  }catch(e:any){

    return new NextResponse(
      `<!doctype html>
<html>
<body style="padding:24px;font-family:monospace;color:#b00020">
  <h2>Preview Build Failed</h2>
  <pre>${String(e?.stack || e)}</pre>
</body>
</html>`,
      { status:500, headers:{ "content-type":"text/html; charset=utf-8" } }
    )

  }
}
