import fs from "fs";
import path from "path";
import crypto from "crypto";
import { runCompileGuard } from "@/lib/ai/compile-guard";

export type ApplyFileChange = {
  path: string;
  content: string;
};

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function safeRel(p: string): string {
  const rel = p.replace(/\\/g, "/").replace(/^\.\/+/, "");
  if (rel.startsWith("../") || rel.includes("..")) {
    throw new Error(`Path traversal not allowed: ${p}`);
  }
  if (rel.startsWith("/")) {
    throw new Error(`Absolute paths not allowed: ${p}`);
  }
  return rel;
}

function rollbackFromBackup(workspaceRoot: string, backupRoot: string, touched: string[]) {
  for (const rel of touched) {
    const fullPath = path.join(workspaceRoot, rel);
    const backupPath = path.join(backupRoot, rel);

    if (fs.existsSync(backupPath)) {
      ensureDir(path.dirname(fullPath));
      fs.copyFileSync(backupPath, fullPath);
    } else {
      if (fs.existsSync(fullPath)) fs.rmSync(fullPath, { force: true });
    }
  }
}

export function applyChangesAtomic(workspaceRoot: string, files: ApplyFileChange[]) {
  const backupId =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : crypto.randomBytes(16).toString("hex");

  const backupRoot = path.join(process.cwd(), "runtime", "backups", backupId);
  ensureDir(backupRoot);

  const touched: string[] = [];
  const writtenFiles: string[] = [];

  try {
    // Write + backup
    for (const f of files) {
      const rel = safeRel(f.path);
      const fullPath = path.join(workspaceRoot, rel);
      touched.push(rel);

      if (fs.existsSync(fullPath)) {
        const backupPath = path.join(backupRoot, rel);
        ensureDir(path.dirname(backupPath));
        fs.copyFileSync(fullPath, backupPath);
      }

      ensureDir(path.dirname(fullPath));
      fs.writeFileSync(fullPath, String(f.content ?? ""), "utf8");
      writtenFiles.push(fullPath);
    }

    // Compile guard (projectRoot == workspaceRoot)
    const guard = runCompileGuard(workspaceRoot, touched);
    if (!guard.ok) {
      rollbackFromBackup(workspaceRoot, backupRoot, touched);
      return {
        ok: false,
        compiled: false,
        rolledBack: true,
        backupId,
        error: guard.output || "Compile guard failed",
      };
    }

    return {
      ok: true,
      compiled: true,
      rolledBack: false,
      backupId,
      writtenFiles,
    };
  } catch (err: any) {
    rollbackFromBackup(workspaceRoot, backupRoot, touched);
    return {
      ok: false,
      compiled: false,
      rolledBack: true,
      backupId,
      error: err?.message ?? "Apply failed",
    };
  }
}
