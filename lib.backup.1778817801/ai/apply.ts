import fs from "fs";
import path from "path";
import crypto from "crypto";
import { runCompileGuard } from "@/lib/ai/compile-guard";

export type ApplyFileChange = { path: string; content: string };

export type ApplyResult =
  | {
      ok: true;
      compiled: true;
      rolledBack: false;
      backupId: string;
      touched: string[];
    }
  | {
      ok: false;
      compiled: false;
      rolledBack: true;
      backupId: string;
      touched: string[];
      error: string;
    };

/**
 * Canonical project root resolver (used by routes).
 */
export function resolveProjectRoot(workspaceId: string, projectId: string) {
  return path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    workspaceId,
    "projects",
    projectId
  );
}

/**
 * 🔒 LOCKED CONTRACT (DO NOT CHANGE):
 * applyWithGuard(projectRoot, files)
 *
 * - Writes files under projectRoot
 * - Runs compile guard
 * - Rolls back on failure
 * - Always returns a backupId for auditing
 */
export async function applyWithGuard(
  projectRoot: string,
  files: ApplyFileChange[]
): Promise<ApplyResult> {
  if (typeof projectRoot !== "string" || !projectRoot) {
    throw new Error("applyWithGuard: projectRoot is required");
  }
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("applyWithGuard: files[] is required");
  }

  const backupId = crypto.randomUUID();
  const backupRoot = path.join(process.cwd(), "runtime", "backups", backupId);

  const touched: string[] = [];
  const prev: Record<string, string | null> = {};

  const readIfExists = (p: string): string | null => {
    try {
      if (!fs.existsSync(p)) return null;
      return fs.readFileSync(p, "utf8");
    } catch {
      return null;
    }
  };

  const writeFile = (p: string, content: string) => {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content, "utf8");
  };

  const copyToBackup = (fullPath: string, relPath: string) => {
    const target = path.join(backupRoot, relPath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (fs.existsSync(fullPath)) fs.copyFileSync(fullPath, target);
  };

  try {
    // 1) backup + apply
    for (const f of files) {
      if (!f || typeof f.path !== "string" || typeof f.content !== "string") {
        continue;
      }

      const rel = f.path.replace(/^\/+/, "");
      const fullPath = path.join(projectRoot, rel);

      prev[rel] = readIfExists(fullPath);
      copyToBackup(fullPath, rel);

      writeFile(fullPath, f.content);
      touched.push(rel);
    }

    if (touched.length === 0) {
      throw new Error("applyWithGuard: no valid file changes");
    }

    // 2) compile guard (workspaceRoot == projectRoot)
    const guard = await runCompileGuard(projectRoot, touched);

    if (!guard.ok) {
      // rollback from in-memory prev snapshot
      for (const rel of touched) {
        const fullPath = path.join(projectRoot, rel);
        const old = prev[rel];

        if (old === null) {
          // file didn't exist before
          try {
            if (fs.existsSync(fullPath)) fs.rmSync(fullPath);
          } catch {
            // ignore
          }
        } else {
          writeFile(fullPath, old);
        }
      }

      return {
        ok: false,
        compiled: false,
        rolledBack: true,
        backupId,
        touched,
        error: guard.output ?? "Compile failed",
      };
    }

    return {
      ok: true,
      compiled: true,
      rolledBack: false,
      backupId,
      touched,
    };
  } catch (e: any) {
    // best-effort rollback
    for (const rel of touched) {
      const fullPath = path.join(projectRoot, rel);
      const old = prev[rel];
      try {
        if (old === null) {
          if (fs.existsSync(fullPath)) fs.rmSync(fullPath);
        } else {
          fs.mkdirSync(path.dirname(fullPath), { recursive: true });
          fs.writeFileSync(fullPath, old, "utf8");
        }
      } catch {
        // ignore
      }
    }

    return {
      ok: false,
      compiled: false,
      rolledBack: true,
      backupId,
      touched,
      error: e?.message ?? "Apply failed",
    };
  }
}
