import fs from "fs";
import path from "path";
import { applyWithGuard } from "@/lib/ai/apply-guard";
import { runCompileGuard } from "@/lib/ai/compile-guard";

export type RepairRequest = {
  workspaceId: string;
  projectId: string;
  files: { path: string; content: string }[];
  maxAttempts?: number;
};

export type RepairResult = {
  ok: boolean;
  attempts: number;
  error?: string;
};

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

export async function runRepairLoop(
  req: RepairRequest
): Promise<RepairResult> {

  const { workspaceId, projectId, files } = req;
  const maxAttempts = Math.min(req.maxAttempts ?? 3, 6);

  const projectRoot = resolveProjectRoot(workspaceId, projectId);

  let attempt = 0;
  let lastError: string | undefined;

  while (attempt < maxAttempts) {
    attempt++;

    const applied = await applyWithGuard(projectRoot, files);

    if (!applied.ok) {
      lastError = "apply failed and was rolled back";
      continue;
    }

    const compile = await runCompileGuard(projectRoot);

    if (compile.ok) {
      return {
        ok: true,
        attempts: attempt
      };
    }

    lastError = compile.output ?? "Compile failed";
  }

  return {
    ok: false,
    attempts: attempt,
    error: lastError ?? "Repair loop exhausted"
  };
}
