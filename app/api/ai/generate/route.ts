import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request){

  const { prompt, projectId } = await req.json();

  if(!prompt || !projectId){
    return NextResponse.json({ ok:false, error:"missing prompt/projectId" });
  }

  const id = Date.now();
  const componentName = "AIGenerated" + id;

  const componentCode = `
export default function ${componentName}(){
  return (
    <div style={{padding:40}}>
      <h2>${componentName}</h2>
      <p>${prompt}</p>
    </div>
  )
}
`;

  const projectRoot = path.join(
    process.cwd(),
    "runtime/workspaces/default/projects",
    projectId
  );

  const compFile = path.join(
    projectRoot,
    "app",
    "ai-generated-" + id + ".tsx"
  );

  await fs.writeFile(compFile, componentCode);

  const pageFile = path.join(projectRoot,"app","page.tsx");

  let page = await fs.readFile(pageFile,"utf-8");

  const importLine = `import ${componentName} from "./ai-generated-${id}";`;

  page = importLine + "\n" + page;

  page = page.replace(
    "<div>",
    `<div>
      <${componentName} />`
  );

  await fs.writeFile(pageFile,page);

  
return NextResponse.json({
  ok: true,
  newFile: "ai-generated-" + id + ".tsx"
});

}
