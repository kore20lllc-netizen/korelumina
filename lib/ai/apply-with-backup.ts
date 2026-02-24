import fs from "fs";
import path from "path";
import crypto from "crypto";

export type ApplyFileChange = {
  path: string;
  content: string;
};

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function safeRel(p: string) {
  const normalized = String(p ?? "")
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "");

  if (!normalized || normalized.startsWith("../") || normalized.includes("/../")) {
    throw new Error("Invalid file path");
  }

  return normalized;
}

export type ApplyWithBackupResult = {
  ok: boolean;
  backupId: string;
  backupRoot: string;
  touched: string[];
  writtenFiles: string[];
  error?: string;
};

export function applyWithBackup(
  workspaceRoot: string,
  files: ApplyFileChange[]
): ApplyWithBackupResult {
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
  const writtenFiles: string[] = [];

  try {
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

    return { ok: true, backupId, backupRoot, touched, writtenFiles };
  } catch (err: any) {
    tryRollback(workspaceRoot, backupRoot, touched);
    return {
      ok: false,
      backupId,
      backupRoot,
      touched,
      writtenFiles,
      error: err?.message ?? "Apply failed",
    };
  }
}

export function tryRollback(
  workspaceRoot: string,
  backupRoot: string,
  touched: string[]
) {
  for (const rel of touched) {
    const fullPath = path.join(workspaceRoot, rel);
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
