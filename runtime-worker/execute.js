const esbuild = require("esbuild")
const path = require("path")

async function run(){

  const projectId = process.argv[2]

  if(!projectId){
    console.error("missing projectId")
    process.exit(1)
  }

  const entry = path.join(
    process.cwd(),
    ".kore_runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    "app",
    "page.tsx"
  )

  const result = await esbuild.build({
    entryPoints:[entry],
    bundle:false,
    write:false,
    format:"esm",
    platform:"browser",

    loader:{ ".ts":"ts",".tsx":"tsx" },

    # 🔥 CRITICAL
    external:["react","react-dom","next","next/navigation"],

    globalName:"RuntimeApp"
  })

  process.stdout.write(result.outputFiles[0].text)
}

run().catch(e=>{
  console.error(e)
  process.exit(1)
})
