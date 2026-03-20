import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

function exists(p:string){
  try{
    return fs.existsSync(p)
  }catch{
    return false
  }
}

export async function GET(){

  const cwd = process.cwd()

  const koreRuntime = path.join(cwd,".kore_runtime")

  const drafts = path.join(koreRuntime,"drafts")
  const journal = path.join(koreRuntime,"journal")
  const ws = path.join(koreRuntime,"workspaces","default","projects","demo-project")

  const runtimeLegacy = path.join(cwd,"runtime")

  return NextResponse.json({

    ok:true,

    cwd,

    koreRuntimeExists: exists(koreRuntime),

    draftsExists: exists(drafts),

    journalExists: exists(journal),

    workspaceExists: exists(ws),

    legacyRuntimeExists: exists(runtimeLegacy),

    sampleDrafts:
      exists(drafts)
        ? fs.readdirSync(drafts)
        : [],

    sampleWorkspaceFiles:
      exists(ws)
        ? fs.readdirSync(ws)
        : [],

    envRuntimeRoot:
      process.env.KORE_RUNTIME_ROOT || null

  })

}
