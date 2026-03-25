import { NextRequest } from "next/server"
import fs from "fs/promises"
import path from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req:NextRequest){

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")

  if(!projectId){
    return new Response("missing projectId",{status:400})
  }

  const root = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    "app",
    "page.tsx"
  )

  let code = ""

  try{
    code = await fs.readFile(root,"utf8")
  }catch{
    return new Response("no runtime file",{status:404})
  }

  // VERY IMPORTANT: transform runtime page
  code = code
    .replace(/export\s+default\s+function\s+Page\s*\(/,"function Page(")

  return new Response(`<!doctype html>
<html>
<body style="margin:0">

<div id="root"></div>

<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

<script type="text/babel">

${code}

ReactDOM.createRoot(document.getElementById("root")).render(<Page/>)

</script>

</body>
</html>`,{
    headers:{ "Content-Type":"text/html" }
  })

}
