import fs from "fs/promises"
import path from "path"
import { runtimeRoot } from "../root"

export async function ensureProjectRoot(projectId:string){

  const root = runtimeRoot()

  const projectRoot = path.join(
    root,
    "workspaces",
    "default",
    "projects",
    projectId
  )

  await fs.mkdir(projectRoot,{ recursive:true })

  return projectRoot
}
