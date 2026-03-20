import fs from "fs/promises"
import path from "path"
import type { IntentState } from "./types"

function statePath(projectId:string){
  return path.join(
    process.cwd(),
    ".kore_runtime",
    "intent-state",
    `${projectId}.json`
  )
}

export async function saveIntentState(projectId:string, state:IntentState){
  const file = statePath(projectId)
  await fs.mkdir(path.dirname(file), { recursive:true })
  await fs.writeFile(file, JSON.stringify(state, null, 2), "utf8")
}

export async function loadIntentState(projectId:string):Promise<IntentState | null>{
  try{
    const raw = await fs.readFile(statePath(projectId), "utf8")
    return JSON.parse(raw)
  }catch{
    return null
  }
}
