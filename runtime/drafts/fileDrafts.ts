import fs from "fs/promises"
import path from "path"

function draftPath(projectId:string){
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

export async function readDrafts(projectId:string){

  try{
    const txt = await fs.readFile(
      draftPath(projectId),
      "utf8"
    )
    return JSON.parse(txt)
  }catch{
    return []
  }

}

export async function writeDraft(projectId:string,draft:any){

  const file = draftPath(projectId)

  let data:any[] = []

  try{
    data = JSON.parse(
      await fs.readFile(file,"utf8")
    )
  }catch{}

  data.push(draft)

  await fs.writeFile(
    file,
    JSON.stringify(data,null,2),
    "utf8"
  )

}

export async function getDraft(projectId:string,draftId:string){

  const rows = await readDrafts(projectId)

  return rows.find((r:any)=>r.id === draftId)

}

export async function removeDraft(projectId:string,draftId:string){

  const rows = await readDrafts(projectId)

  const next = rows.filter((r:any)=>r.id !== draftId)

  await fs.writeFile(
    draftPath(projectId),
    JSON.stringify(next,null,2),
    "utf8"
  )

}
