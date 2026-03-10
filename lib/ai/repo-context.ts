import fs from "fs";
import path from "path";

export function scanProjectTree(root:string){

  const files:string[] = [];

  function walk(dir:string){
    for(const f of fs.readdirSync(dir)){
      const p = path.join(dir,f);

      if(
        f === "node_modules" ||
        f === ".next" ||
        f === ".git"
      ) continue;

      const stat = fs.statSync(p);

      if(stat.isDirectory()){
        walk(p);
      }else{
        files.push(path.relative(root,p));
      }
    }
  }

  walk(root);

  return files.slice(0,200);
}
