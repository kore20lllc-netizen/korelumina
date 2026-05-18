import fs from "fs";
import path from "path";

export function copyTemplate(src:string,dst:string){

  if(!fs.existsSync(src)) return;

  fs.mkdirSync(dst,{recursive:true});

  for(const item of fs.readdirSync(src)){

    const s = path.join(src,item);
    const d = path.join(dst,item);

    const stat = fs.statSync(s);

    if(stat.isDirectory()){
      copyTemplate(s,d);
    }else{
      fs.copyFileSync(s,d);
    }
  }
}
