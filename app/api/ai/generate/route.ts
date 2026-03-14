import { pushEntry } from "@/runtime/journal"
import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function POST(req:Request){

  const body = await req.json()
  const { projectId, prompt } = body

  const root = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId
  )

  const ts = Date.now()
  const fileName = `ai-generated-${ts}.tsx`
  const filePath = path.join(root,"app",fileName)

  // --- create component
  const code = `
export default function AIGenerated(){
  return (
    <div style={{padding:40}}>
      <h1>AI Generated</h1>
      <pre>${prompt}</pre>
    </div>
  )
}
`

  await fs.mkdir(path.dirname(filePath),{recursive:true})
  await fs.writeFile(filePath,code,"utf8")

  // --- rewrite ENTRY PAGE
  const entry = `
import AIGenerated from "./${fileName}"

export default function Page(){
  return <AIGenerated/>
}
`

  await fs.writeFile(
    path.join(root,"app","page.tsx"),
    entry,
    "utf8"
  )

  // --- append journal
  const journalPath = path.join(root,".journal.json")

  let journal:any[] = []

  try{
    const raw = await fs.readFile(journalPath,"utf8")
    journal = JSON.parse(raw)
  }catch{}

  journal.push({
    t: Date.now(),
    type:"ai-generate",
    file:fileName,
    prompt
  })

  await fs.writeFile(
    journalPath,
    JSON.stringify(journal,null,2),
    "utf8"
  )

  pushEntry(projectId,{ t:Date.now(), type:"ai-generate", file:fileName, prompt });
return NextResponse.json({
    ok:true,
    newFile:fileName
  })
}
