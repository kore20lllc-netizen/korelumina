import fs from "fs/promises"
import path from "path"
import { runtimeRoot } from "../root"

function draftDir(projectId:string){
  return path.join(
    runtimeRoot(),
    "drafts",
    projectId
  )
}

export async function loadDraft(projectId:string,draftId:string){

  const dir = path.join(
    draftDir(projectId),
    draftId
  )

  try{
    const files = await collect(dir,"")
    return { files }
  }catch{
    return null
  }

}

async function collect(dir:string,base:string):Promise<any[]>{

  const out:any[] = []

  const list = await fs.readdir(dir)

  for(const name of list){

    const full = path.join(dir,name)
    const rel = path.join(base,name)

    const stat = await fs.stat(full)

    if(stat.isDirectory()){
      out.push(...await collect(full,rel))
    }else{
      const content = await fs.readFile(full,"utf8")
      out.push({
        path: rel,
        content
      })
    }

  }

  return out
}
