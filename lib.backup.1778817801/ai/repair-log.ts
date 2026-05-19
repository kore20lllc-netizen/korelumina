import fs from "fs";
import path from "path";

export type RepairLogEvent =
  | {
      t: number;
      type: "repair_start";
      workspaceId: string;
      projectId: string;
      maxAttempts: number;
    }
  | {
      t: number;
      type: "attempt_start";
      attempt: number;
      touched: string[];
    }
  | {
      t: number;
      type: "attempt_apply_result";
      attempt: number;
      ok: boolean;
      rolledBack?: boolean;
      backupId?: string;
      error?: string;
    }
  | {
      t: number;
      type: "attempt_compile_result";
      attempt: number;
      ok: boolean;
      output?: string;
    }
  | {
      t: number;
      type: "attempt_end";
      attempt: number;
      ok: boolean;
      note?: string;
    }
  | {
      t: number;
      type: "repair_end";
      ok: boolean;
      attempts: number;
      error?: string;
    };

export function repairLogPath(workspaceId: string, projectId: string, runId: string) {
  return path.join(
    process.cwd(),
    "runtime",
    "ai",
    "repair",
    workspaceId,
    projectId,
    `${runId}.jsonl`
  );
}

export function appendRepairLog(filePath: string, event: RepairLogEvent) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, JSON.stringify(event) + "\n", "utf8");
}
