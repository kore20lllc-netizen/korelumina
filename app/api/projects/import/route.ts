import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ImportBody = {
  repoUrl?: string;
  projectId?: string;
  branch?: string;
};

function safeProjectId(input?: string) {
  const raw = (input || "imported-project").trim().toLowerCase();
  const cleaned = raw.replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-");
  return cleaned || "imported-project";
}

function isAllowedRepoUrl(repoUrl: string) {
  return /^(https:\/\/|git@github\.com:|git@gitlab\.com:)/i.test(repoUrl);
}

function countFiles(dir: string) {
  let count = 0;
  const stack = [dir];

  while (stack.length) {
    const current = stack.pop()!;
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.name === ".git") continue;
      if (entry.isDirectory()) stack.push(full);
      else count++;
    }
  }

  return count;
}

function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === ".git") continue;

    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

function removeDirSafe(target: string) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

export async function POST(req: NextRequest) {
  let tempRoot = "";
  let cloneDir = "";

  try {
    const body = (await req.json()) as ImportBody;

    const repoUrl = (body.repoUrl || "").trim();
    const projectId = safeProjectId(body.projectId);
    const branch = (body.branch || "").trim();

    if (!repoUrl) {
      return NextResponse.json(
        { ok: false, error: "repoUrl is required" },
        { status: 400 }
      );
    }

    if (!isAllowedRepoUrl(repoUrl)) {
      return NextResponse.json(
        { ok: false, error: "Only https/git GitHub or GitLab URLs are allowed" },
        { status: 400 }
      );
    }

    const projectsRoot = path.join(
      process.cwd(),
      "runtime",
      "workspaces",
      "default",
      "projects"
    );

    const projectRoot = path.join(projectsRoot, projectId);

    fs.mkdirSync(projectsRoot, { recursive: true });

    tempRoot = path.join(os.tmpdir(), `korelumina-import-${crypto.randomUUID()}`);
    cloneDir = path.join(tempRoot, "repo");
    fs.mkdirSync(tempRoot, { recursive: true });

    const cloneArgs = ["clone", "--depth", "1"];
    if (branch) {
      cloneArgs.push("--branch", branch);
    }
    cloneArgs.push(repoUrl, cloneDir);

    await execFileAsync("git", cloneArgs, { timeout: 120000 });

    const gitDir = path.join(cloneDir, ".git");
    if (fs.existsSync(gitDir)) {
      fs.rmSync(gitDir, { recursive: true, force: true });
    }

    removeDirSafe(projectRoot);
    fs.mkdirSync(projectRoot, { recursive: true });
    copyDir(cloneDir, projectRoot);

    const fileCount = countFiles(projectRoot);

    return NextResponse.json({
      ok: true,
      projectId,
      projectRoot,
      fileCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Import failed",
      },
      { status: 500 }
    );
  } finally {
    if (tempRoot) {
      removeDirSafe(tempRoot);
    }
  }
}
