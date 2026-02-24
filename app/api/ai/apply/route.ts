import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { runCompileGuard } from "@/lib/ai/compile-guard";

interface FileChange {
  path: string;
  content: string;
}

interface ApplyRequest {
  workspaceId: string;
  projectId: string;
  files: FileChange[];
}

function resolveProjectRoot(workspaceId: string, projectId: string) {
  return path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    workspaceId,
    "projects",
    projectId
  );
}

function safeRel(p: string) {
  if (!p || typeof p !== "string") {
    throw new Error("Invalid file path");
  }
  if (p.includes("..")) {
    throw new Error("Path traversal not allowed");
  }
  if (path.isAbsolute(p)) {
    throw new Error("Absolute paths not allowed");
  }
  return p.replace(/\\/g, "/");
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function rollbackFromBackup(
  projectRoot: string,
  backupRoot: string,
  touched: string[]
) {
  for (const rel of touched) {
    const fullPath = path.join(projectRoot, rel);
    const backupPath = path.join(backupRoot, rel);

    if (fs.existsSync(backupPath)) {
      ensureDir(path.dirname(fullPath));
      fs.copyFileSync(backupPath, fullPath);
    } else {
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { force: true });
      }
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ApplyRequest;
    const { workspaceId, projectId, files } = body;

    if (!workspaceId || !projectId || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "Invalid apply payload" },
        { status: 400 }
      );
    }

    const projectRoot = resolveProjectRoot(workspaceId, projectId);

    if (!fs.existsSync(projectRoot)) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const backupId =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : crypto.randomBytes(16).toString("hex");

    const backupRoot = path.join(
      process.cwd(),
      "runtime",
      "backups",
      backupId
    );

    ensureDir(backupRoot);

    const touched: string[] = [];

    // Write + backup
    for (const change of files) {
      const rel = safeRel(change.path);
      const fullPath = path.join(projectRoot, rel);
      touched.push(rel);

      if (fs.existsSync(fullPath)) {
        const backupPath = path.join(backupRoot, rel);
        ensureDir(path.dirname(backupPath));
        fs.copyFileSync(fullPath, backupPath);
      }

      ensureDir(path.dirname(fullPath));
      fs.writeFileSync(fullPath, String(change.content ?? ""), "utf8");
    }

    // STRICT TypeScript compile guard
    const guard = runCompileGuard(projectRoot, touched);

    if (!guard.ok) {
      rollbackFromBackup(projectRoot, backupRoot, touched);

      return NextResponse.json(
        {
          ok: false,
          compiled: false,
          rolledBack: true,
          backupId,
          error: guard.output ?? "Compile failed",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      compiled: true,
      rolledBack: false,
      backupId,
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Apply error" },
      { status: 500 }
    );
  }
}
