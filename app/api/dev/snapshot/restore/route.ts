import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

function copyDir(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });

  for (const file of fs.readdirSync(src)) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    if (fs.lstatSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export async function POST(req: Request) {
  try {
    const { projectId, snapshotId } = await req.json();

    const projectPath = path.join(
      process.cwd(),
      "runtime/workspaces/default/projects",
      projectId
    );

    const snapshotPath = path.join(
      process.cwd(),
      "runtime/snapshots",
      projectId,
      snapshotId
    );

    if (!fs.existsSync(snapshotPath)) {
      return NextResponse.json(
        { ok: false, error: "Snapshot not found" },
        { status: 404 }
      );
    }

    // wipe current project
    fs.rmSync(projectPath, { recursive: true, force: true });

    // restore snapshot
    copyDir(snapshotPath, projectPath);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
