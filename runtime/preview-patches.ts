import path from "path"
import fs from "fs/promises"

export async function pushPatch(opts:{
  projectRoot:string
  file:string
  content:string
}){

  if(!opts.file){
    console.log("🔥 PATCH SKIPPED — NO FILE")
    return
  }

  const full = path.join(opts.projectRoot, opts.file)

  await fs.mkdir(path.dirname(full),{ recursive:true })

  await fs.writeFile(full, opts.content, "utf8")

}
