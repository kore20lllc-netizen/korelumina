import fs from "fs/promises"
import path from "path"
import { runtimeRoot } from "../root"

function journalFile(projectId:string){
  return path.join(
    runtimeRoot(),
    "journal",
    projectId + ".json"
  )
}

export async function pushEntry(projectId:string, entry:any){

  const file = journalFile(projectId)

  await fs.mkdir(path.dirname(file), { recursive:true })

  let data:any = { entries:[] }

  try{
    const raw = await fs.readFile(file,"utf8")
    data = JSON.parse(raw)
  }catch{}

  data.entries.push(entry)

  await fs.writeFile(file, JSON.stringify(data,null,2))
}

export async function getJournal(projectId:string){

  const file = journalFile(projectId)

  try{
    const raw = await fs.readFile(file,"utf8")
    return JSON.parse(raw)
  }catch{
    return { entries:[] }
  }

}
