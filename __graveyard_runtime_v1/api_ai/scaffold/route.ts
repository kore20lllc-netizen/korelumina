import path from "path";
import fs from "fs";
import { NextResponse } from "next/server";
import { copyTemplate } from "@/lib/ai/template-copy";

export async function POST(req:Request){

  const body = await req.json();
  const { workspaceId="default", projectId } = body;

  if(!projectId){
    return NextResponse.json({error:"missing projectId"},{status:400});
  }

  const projectRoot = path.join(
    process.cwd(),
    "runtime/workspaces",
    workspaceId,
    "projects",
    projectId
  );

  const templateRoot = path.join(
    process.cwd(),
    "templates",
    "next-saas"
  );

  if(!fs.existsSync(projectRoot)){
    fs.mkdirSync(projectRoot,{recursive:true});
  }

  copyTemplate(templateRoot,projectRoot);

  return NextResponse.json({
    ok:true,
    projectId
  });
}
