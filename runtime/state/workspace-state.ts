import fs from "fs/promises"
import path from "path"
import { runtimeRoot } from "../root"

export type WorkspaceState = {
  buildType: "website" | "app" | "saas"
  mode: "ai" | "designer" | "developer"
}

function stateFile(projectId:string){
  return path.join(
    runtimeRoot(),
    "state",
    projectId + ".json"
  )
}

export async function saveWorkspaceState(projectId:string,state:WorkspaceState){
  await fs.mkdir(
    path.join(runtimeRoot(),"state"),
    { recursive:true }
  )

  await fs.writeFile(
    stateFile(projectId),
    JSON.stringify(state,null,2),
    "utf8"
  )
}

export async function loadWorkspaceState(projectId:string):Promise<WorkspaceState | null>{
  try{
    const raw = await fs.readFile(stateFile(projectId),"utf8")
    return JSON.parse(raw)
  }catch{
    return null
  }
}
