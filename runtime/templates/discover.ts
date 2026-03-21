import fs from "fs/promises"
import path from "path"

export type TemplateMeta = {
  id:string
  name:string
  type:"website"|"app"|"mobile"|"backend"
  mode:"dev"|"designer"
  path:string
}

export async function discoverTemplates():Promise<TemplateMeta[]>{

  const root = path.join(process.cwd(),"templates")

  async function walk(dir:string):Promise<string[]>{
    const items = await fs.readdir(dir,{ withFileTypes:true })
    const out:string[] = []

    for(const i of items){
      const full = path.join(dir,i.name)
      if(i.isDirectory()){
        out.push(...await walk(full))
      }else if(i.name === "template.json"){
        out.push(full)
      }
    }

    return out
  }

  const files = await walk(root)

  const templates:TemplateMeta[] = []

  for(const file of files){
    const raw = await fs.readFile(file,"utf-8")
    const meta = JSON.parse(raw)

    templates.push({
      id:meta.id,
      name:meta.name,
      type:meta.type,
      mode:meta.mode,
      path:path.dirname(file)
    })
  }

  return templates
}
