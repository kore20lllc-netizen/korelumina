import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

function walk(dir:string,base:string,acc:string[]=[]){
  const items = fs.readdirSync(dir);
  for(const item of items){
    const full = path.join(dir,item);
    const rel = path.relative(base,full);
    const stat = fs.statSync(full);
    if(stat.isDirectory()){
      walk(full,base,acc);
    } else {
      acc.push(rel);
    }
  }
  return acc;
}

export async function GET(req:Request){
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if(!projectId){
    return NextResponse.json({error:"missing projectId"},{status:400});
  }

  const root = path.join(
    process.cwd(),
    "runtime/workspaces/default/projects",
    projectId
  );

  if(!fs.existsSync(root)){
    return NextResponse.json({files:[]});
  }

  const files = walk(root,root);

  return NextResponse.json({files});
}
