import { NextRequest } from "next/server"
import path from "path"
import fs from "fs/promises"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest){

  try{

    const esbuild = eval("require")("esbuild")

    const projectId =
      req.nextUrl.searchParams.get("projectId")

    if(!projectId){
      return new Response("missing projectId",{status:400})
    }

    const entry =
      path.join(
        process.cwd(),
        ".kore_runtime",
        "workspaces",
        "default",
        "projects",
        projectId,
        "app",
        "page.tsx"
      )

    const exists =
      await fs.stat(entry).then(()=>true).catch(()=>false)

    if(!exists){
      return new Response("missing runtime entry",{status:404})
    }

    const result = await esbuild.build({
      entryPoints:[entry],
      bundle:true,
      write:false,
      format:"iife",
      platform:"browser",
      globalName:"RuntimeApp",
      jsx:"transform"
    })

    const code =
      result.outputFiles?.[0]?.text || ""

    const html = `
<html>
<body style="margin:0">
<div id="root"></div>

<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<script>
try{

${code}

let mod =
  window.RuntimeApp ||
  window.default ||
  window.Page ||
  window.Draft

let Comp =
  mod?.default ||
  mod

if(!Comp){
  document.body.innerHTML =
    "<pre style='color:red;padding:20px'>No component export detected</pre>"
}else{
  ReactDOM.createRoot(
    document.getElementById("root")
  ).render(
    React.createElement(Comp)
  )
}

}catch(e){
  document.body.innerHTML =
    "<pre style='color:red;padding:20px'>"+e.message+"</pre>"
}
</script>

</body>
</html>
`

    return new Response(html,{
      headers:{ "content-type":"text/html" }
    })

  }catch(e:any){

    return new Response(e.message,{status:500})

  }

}
