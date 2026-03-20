import fs from "fs/promises"
import path from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function RuntimePage({ params }: any){

  const { projectId } = await params

  const file = path.join(
    process.cwd(),
    ".kore_runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    "app",
    "page.tsx"
  )

  let code = ""

  try{
    code = await fs.readFile(file,"utf8")
  }catch{
    code = "NO RUNTIME PAGE"
  }

  return (
    <div style={{padding:40,fontFamily:"sans-serif"}}>
      <h1>Runtime Viewer</h1>
      <pre>{code}</pre>
    </div>
  )
}
