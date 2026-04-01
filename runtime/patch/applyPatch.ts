import fs from "fs/promises"
import path from "path"

export async function applyPatch(
  projectRoot:string,
  filePath:string,
  newContent:string
){

  const full = path.join(projectRoot,filePath)

  await fs.mkdir(path.dirname(full),{ recursive:true })

  await fs.writeFile(full,newContent,"utf8")

  return { ok:true }

}
