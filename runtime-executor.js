const esbuild = require("esbuild")
const fs = require("fs")
const path = require("path")

const projectId = process.argv[2]

if(!projectId){
  console.error("missing projectId")
  process.exit(1)
}

const ROOT = path.join(
  process.cwd(),
  ".kore_runtime",
  "workspaces",
  "default",
  "projects",
  projectId,
  "app"
)

const entry = path.join(ROOT,"page.tsx")

esbuild.build({
  entryPoints:[entry],
  bundle:true,
  write:false,
  format:"iife",
  platform:"browser",
  loader:{
    ".ts":"ts",
    ".tsx":"tsx"
  }
}).then(result=>{
  process.stdout.write(result.outputFiles[0].text)
}).catch(e=>{
  console.error(e)
  process.exit(1)
})
