import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";

type Ctx = {
  params: Promise<{ workspaceId: string; projectId: string }>;
};

export async function GET(_req: Request, context: Ctx) {
  const { workspaceId, projectId } = await context.params;

  const projectRoot = resolveWorkspacePath(workspaceId, projectId);
  assertProjectExists(projectRoot);

  const pkgPath = path.join(projectRoot, "package.json");

  let pkg: any = null;
  if (fs.existsSync(pkgPath)) {
    pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  }

  return NextResponse.json({
    workspaceId,
    projectId,
    exists: true,
    hasPackageJson: !!pkg,
    scripts: pkg?.scripts ?? {},
    dependencies: Object.keys(pkg?.dependencies ?? {}),
    devDependencies: Object.keys(pkg?.devDependencies ?? {}),
  });
}
