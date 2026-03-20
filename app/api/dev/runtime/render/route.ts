export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import * as esbuild from "esbuild"

export async function GET(req:NextRequest){

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")

  if(!projectId){
    return new NextResponse("missing projectId",{status:400})
  }

  const root = path.join(
    process.cwd(),
    ".kore_runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    "app"
  )

  const entry = path.join(root,"page.tsx")

  let result

  try{
    result = await esbuild.build({
      entryPoints:[entry],
      bundle:true,
      write:false,
      format:"iife",
      platform:"browser",
      jsx:"automatic",
      loader:{".tsx":"tsx",".ts":"ts"}
    })
  }catch(e:any){
    return new NextResponse(
      "<pre style='color:red'>"+e.message+"</pre>",
      {headers:{ "content-type":"text/html"}}
    )
  }

  const code = result.outputFiles[0].text

  return new NextResponse(`
<html>
<body>
<div id="root"></div>

<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<script>
${code}

const App = window.default || window.Draft || window.Page

ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(App)
)
</script>

</body>
</html>
`,{
headers:{ "content-type":"text/html"}
})
}
