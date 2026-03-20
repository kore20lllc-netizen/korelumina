const fs = require("fs")
const path = require("path")
const esbuild = require("esbuild")

async function render(projectId){

  const root = path.join(
    process.cwd(),
    ".kore_runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    "app"
  )

  const entry = path.join(root,"page.tsx")

  const outfile = path.join(root,"__bundle.js")

  await esbuild.build({
    entryPoints:[entry],
    bundle:true,
    platform:"browser",
    format:"iife",
    outfile,
    loader:{
      ".ts":"ts",
      ".tsx":"tsx"
    }
  })

  return outfile
}

module.exports = { render }
