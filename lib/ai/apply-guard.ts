import fs from "fs"
import path from "path"
import { execSync } from "child_process"

export type FileChange = {
  path: string
  content: string
}

export function applyWithGuard(projectRoot: string, files: FileChange[]) {

  const backup: { path:string; content:string|null }[] = []

  for(const f of files){

    const abs = path.join(projectRoot, f.path)

    if(fs.existsSync(abs)){
      backup.push({
        path: abs,
        content: fs.readFileSync(abs,"utf8")
      })
    }else{
      backup.push({
        path: abs,
        content: null
      })
    }

    fs.mkdirSync(path.dirname(abs),{recursive:true})
    fs.writeFileSync(abs,f.content,"utf8")
  }

  try{

    execSync("npx tsc --noEmit",{cwd:projectRoot,stdio:"pipe"})

    return {ok:true}

  }catch(err){

    for(const b of backup){

      if(b.content===null){
        if(fs.existsSync(b.path)) fs.unlinkSync(b.path)
      }else{
        fs.writeFileSync(b.path,b.content,"utf8")
      }

    }

    return {ok:false,rolledBack:true}
  }
}
