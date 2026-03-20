import fs from "fs/promises"
import path from "path"

export async function applyRuntimePatch({
  projectRoot,
  filePath,
  content
}:{
  projectRoot:string
  filePath:string
  content:string
}){

  const full = path.join(projectRoot, filePath)

  await fs.mkdir(path.dirname(full), { recursive:true })

  await fs.writeFile(full, content, "utf8")

}
