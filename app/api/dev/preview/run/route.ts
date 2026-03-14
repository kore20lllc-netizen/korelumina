import { ensureProjectRoot } from "@/runtime/fs/ensureProjectRoot";
import { NextRequest } from "next/server"
import fs from "fs/promises"
import path from "path"
import * as esbuild from "esbuild"

export async function GET(req: NextRequest){

  const projectId =
    req.nextUrl.searchParams.get("projectId") || "demo-project"

  const projectRoot = ensureProjectRoot(projectId)

  const root = path.join(projectRoot, "app")
  const entry = path.join(root, "page.tsx")

  try{
    await fs.access(entry)
  }catch{
    return new Response(
      "<html><body>Missing app/page.tsx</body></html>",
      { headers:{ "content-type":"text/html" }, status:404 }
    )
  }

  try{
    const result = await esbuild.build({
      entryPoints:[entry],
      bundle:true,
      write:false,
      format:"iife",
      globalName:"KorePreviewApp",
      platform:"browser",
      jsx:"automatic",
      target:["es2020"],
      loader:{
        ".ts":"ts",
        ".tsx":"tsx"
      }
    })

    const code = result.outputFiles[0].text

    const html = `
<!doctype html>
<html>
<body style="margin:0">
<div id="root"></div>

<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<script>
globalThis.global = globalThis;
globalThis.process = globalThis.process || { env:{} };
globalThis.module = globalThis.module || { exports:{} };
globalThis.exports = globalThis.exports || globalThis.module.exports;
globalThis.require = globalThis.require || function(name){
  throw new Error("require not available in preview runtime: " + name);
};
</script>

<script>
${code}

try{
  const App =
    globalThis.KorePreviewApp?.default ||
    globalThis.KorePreviewApp ||
    globalThis.module?.exports?.default ||
    globalThis.exports?.default;

  if(!App){
    throw new Error("Preview app export not found");
  }

  ReactDOM.createRoot(
    document.getElementById("root")
  ).render(
    React.createElement(App)
  );
}catch(e){
  document.body.innerHTML =
    "<pre style='padding:16px;color:red;white-space:pre-wrap'>" +
    (e?.stack || e?.message || String(e)) +
    "</pre>";
}
</script>

</body>
</html>
`

    return new Response(html,{
      headers:{ "content-type":"text/html" }
    })

  }catch(e:any){
    return new Response(
      "<pre style='white-space:pre-wrap;padding:16px'>" +
      String(e?.stack || e?.message || e) +
      "</pre>",
      {
        headers:{ "content-type":"text/html" },
        status:500
      }
    )
  }
}
