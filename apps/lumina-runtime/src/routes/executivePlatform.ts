import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import type { Express, Request, Response } from "express";

/*
 * MS-2026-0004 (E3.T1): the Executive Office platform card reads the
 * platform from the repository itself: where it lives, the branch and
 * latest commit, and what each workspace is built with. Read-only; any part
 * that cannot be read is null, never guessed.
 */

export interface PlatformWorkspace {
  path: string;
  name: string;
  stack: string[];
}

export interface PlatformFacts {
  repository: string | null;
  branch: string | null;
  head: { sha: string; subject: string; committedAt: number } | null;
  workspaces: PlatformWorkspace[];
  /*
   * MS-2026-0004 (E1.T2): records Runtime wrote that are not committed yet,
   * so the office can recommend committing them (MS-2026-0007).
   */
  uncommittedRecords: { learningRecords: number; runtimeRecords: number } | null;
}

/* Counts `git status --porcelain` lines for Learning Records and Runtime records. */
export function countUncommittedRecords(porcelain: string): { learningRecords: number; runtimeRecords: number } {
  let learningRecords = 0;
  let runtimeRecords = 0;
  for (const line of porcelain.split("\n")) {
    const file = line.slice(3).trim().replace(/^"|"$/g, "");
    if (!file) continue;
    if (file.startsWith("docs/learning/")) learningRecords += 1;
    else if (file.startsWith("runtime/") || file.startsWith("runtime-data/")) runtimeRecords += 1;
  }
  return { learningRecords, runtimeRecords };
}

/* "https://github.com/owner/repo.git" or "git@github.com:owner/repo.git" to "owner/repo". */
export function repositoryName(remote: string): string | null {
  const trimmed = remote.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/[:/]([^/:]+\/[^/]+?)(?:\.git)?\/?$/);
  return match ? match[1] : null;
}

const STACK_MARKERS: Array<[string, string]> = [
  ["vite", "Vite"],
  ["react", "React"],
  ["express", "Express"],
  ["typescript", "TypeScript"],
];

export function workspaceStack(manifest: Record<string, any>): string[] {
  const dependencies = { ...(manifest.dependencies ?? {}), ...(manifest.devDependencies ?? {}) };
  return STACK_MARKERS.filter(([dependency]) => dependency in dependencies).map(([, label]) => label);
}

function git(repositoryRoot: string, args: string[]): string | null {
  try {
    return execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

export function readPlatformFacts(repositoryRoot: string): PlatformFacts {
  const remote = git(repositoryRoot, ["remote", "get-url", "origin"]);
  const branch = git(repositoryRoot, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const log = git(repositoryRoot, ["log", "-1", "--format=%H%x1f%s%x1f%ct"]);
  const [sha, subject, seconds] = log ? log.split("\x1f") : [];
  const status = git(repositoryRoot, ["status", "--porcelain", "--untracked-files=all", "--", "docs/learning", "runtime", "runtime-data"]);

  const workspaces: PlatformWorkspace[] = [];
  try {
    const root = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "package.json"), "utf8"));
    const patterns: string[] = Array.isArray(root.workspaces) ? root.workspaces : [];
    for (const pattern of patterns) {
      if (!pattern.endsWith("/*")) continue;
      const parent = pattern.slice(0, -2);
      const directory = path.join(repositoryRoot, parent);
      if (!fs.existsSync(directory)) continue;
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const manifestFile = path.join(directory, entry.name, "package.json");
        if (!entry.isDirectory() || !fs.existsSync(manifestFile)) continue;
        const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
        workspaces.push({ path: `${parent}/${entry.name}`, name: String(manifest.name ?? entry.name), stack: workspaceStack(manifest) });
      }
    }
  } catch {
    /* An unreadable manifest leaves the workspace list empty. */
  }

  return {
    repository: remote ? repositoryName(remote) : null,
    branch,
    head: sha ? { sha, subject: subject ?? "", committedAt: Number(seconds) * 1000 } : null,
    workspaces: workspaces.sort((left, right) => left.path.localeCompare(right.path)),
    uncommittedRecords: status === null ? null : countUncommittedRecords(status),
  };
}

export function registerExecutivePlatformRoute(app: Express, repositoryRoot: string): void {
  app.get("/api/executive/platform", (_req: Request, res: Response) =>
    res.json({ ok: true, platform: readPlatformFacts(repositoryRoot) }),
  );
}
