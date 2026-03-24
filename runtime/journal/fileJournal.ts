import fs from "fs/promises"
import path from "path"

function journalPath(projectId:string){
  return path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    ".journal.json"
  )
}

export async function readJournal(projectId:string){
  try{
    const txt = await fs.readFile(journalPath(projectId),"utf8")
    return JSON.parse(txt)
  }catch{
    return []
  }
}

export async function appendJournal(projectId:string,entry:any){
  const rows = await readJournal(projectId)
  rows.push(entry)

  await fs.mkdir(
    path.dirname(journalPath(projectId)),
    { recursive:true }
  )

  await fs.writeFile(
    journalPath(projectId),
    JSON.stringify(rows,null,2),
    "utf8"
  )
}
