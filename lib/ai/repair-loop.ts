import path from "path";
import { runCompileGuard } from "@/lib/ai/compile-guard";
import { applyWithGuard, type ApplyFileChange } from "@/lib/ai/apply";

export interface RepairRequest {
  workspaceId: string;
  projectId: string;
  maxAttempts?: number;
  files: ApplyFileChange[];
}

export interface RepairResult {
  ok: boolean;
  attempts: number;
  error?: string;
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

export async function runRepairLoop(
  req: RepairRequest
): Promise<RepairResult> {

  const { workspaceId, projectId, files } = req;
  const maxAttempts = req.maxAttempts ?? 3;

  const projectRoot = resolveProjectRoot(workspaceId, projectId);

  let attempt = 0;
  let lastError: string | undefined;

  while (attempt < maxAttempts) {
    attempt++;

    const result = await applyWithGuard(projectRoot, files);

    if (!result.ok) {
      lastError = result.error;
      continue;
    }

    // ✅ FIX — await compile guard
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
    error: lastError
  };
}
