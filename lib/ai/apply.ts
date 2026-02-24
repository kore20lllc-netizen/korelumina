import fs from "fs";
import path from "path";
import crypto from "crypto";
import { runCompileGuard } from "@/lib/ai/compile-guard";

export interface ApplyFileChange {
  path: string;
  content: string;
}

interface ApplyResult {
  ok: boolean;
  compiled: boolean;
  rolledBack?: boolean;
  backupId?: string;
  error?: string;
}

function backupFiles(root: string, files: string[]) {
  const backupId = crypto.randomUUID();
  const backupRoot = path.join(
    process.cwd(),
    "runtime",
    "backups",
    backupId
  );

  for (const file of files) {
    const fullPath = path.join(root, file);
    if (!fs.existsSync(fullPath)) continue;

    const target = path.join(backupRoot, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(fullPath, target);
  }

  return { backupId, backupRoot };
}

function rollbackFromBackup(
  root: string,
  backupRoot: string,
  files: string[]
) {
  for (const file of files) {
    const backupFile = path.join(backupRoot, file);
    if (!fs.existsSync(backupFile)) continue;

    const fullPath = path.join(root, file);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.copyFileSync(backupFile, fullPath);
  }
}

export async function applyWithGuard(
  workspaceRoot: string,
  changes: ApplyFileChange[]
): Promise<ApplyResult> {

  const touched = changes.map(f => f.path);

  const { backupId, backupRoot } = backupFiles(workspaceRoot, touched);

  for (const change of changes) {
    const fullPath = path.join(workspaceRoot, change.path);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, change.content, "utf8");
  }

  // ✅ CORRECT — await the compile guard
  const guard = await runCompileGuard(workspaceRoot);

  if (!guard.ok) {
    rollbackFromBackup(workspaceRoot, backupRoot, touched);

    return {
      ok: false,
      compiled: false,
      rolledBack: true,
      backupId,
      error: guard.output ?? "Compile failed"
    };
  }

  return {
    ok: true,
    compiled: true,
    backupId
  };
}
