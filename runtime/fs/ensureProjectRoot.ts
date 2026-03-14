import fs from "fs";
import path from "path";
import { bootstrapProject } from "./bootstrapProject";

export function ensureProjectRoot(projectId:string){

  const root = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId
  );

  if(!fs.existsSync(root)){
    fs.mkdirSync(root,{ recursive:true });
  }

  bootstrapProject(root);

  return root;
}
