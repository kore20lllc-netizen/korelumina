import fs from "fs/promises"
import path from "path"

export type Draft = {
  id: string
  path: string
  content: string
  t: number
}

function draftsPath(projectId:string){
  return path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    ".drafts.json"
  )
}

async function readAll(projectId:string): Promise<Draft[]>{
  try{
    const txt = await fs.readFile(draftsPath(projectId),"utf8")
    const data = JSON.parse(txt)
    return Array.isArray(data) ? data : []
  }catch{
    return []
  }
}

async function writeAll(projectId:string, rows:Draft[]){
  const file = draftsPath(projectId)
  await fs.mkdir(path.dirname(file),{ recursive:true })
  await fs.writeFile(file, JSON.stringify(rows,null,2), "utf8")
}

export async function pushDraft(projectId:string, draft:Draft){
  const rows = await readAll(projectId)
  rows.push(draft)
  await writeAll(projectId, rows)
}

export async function listDrafts(projectId:string){
  return await readAll(projectId)
}

export async function getDraft(projectId:string, draftId:string){
  const rows = await readAll(projectId)
  return rows.find(d => d.id === draftId) || null
}

export async function removeDraft(projectId:string, draftId:string){
  const rows = await readAll(projectId)
  const next = rows.filter(d => d.id !== draftId)
  await writeAll(projectId, next)
}
