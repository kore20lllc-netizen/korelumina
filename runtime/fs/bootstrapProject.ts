import fs from "fs";
import path from "path";

export function bootstrapProject(root:string){

  const appDir = path.join(root,"app");

  if(!fs.existsSync(appDir)){
    fs.mkdirSync(appDir,{recursive:true});
  }

  const page = path.join(appDir,"page.tsx");

  if(!fs.existsSync(page)){
    fs.writeFileSync(
      page,
`export default function Page(){
  return <div>Hello Korelumina</div>
}`
    );
  }

}
