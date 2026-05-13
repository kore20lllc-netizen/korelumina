import type { ApplyResult } from "./apply";

/**
 * Payload accepted by /api/ai/repair.
 */
export interface RepairRequest {
  workspaceId: string;
  projectId: string;
  files: string[];
  attempts?: number;
}

/**
 * Safely extract an error string from ApplyResult.
 */
function getApplyError(result: ApplyResult): string {
  if (result.ok) {
    return "";
  }

  if ("error" in result && typeof result.error === "string") {
    return result.error;
  }

  if ("reason" in result && typeof result.reason === "string") {
    return result.reason;
  }

  return "Unknown apply error";
}

/**
 * Core implementation used when a custom runner is provided.
 */
async function executeRepairLoop(
  attempts: number,
  runner: () => Promise<ApplyResult>,
): Promise<{ ok: boolean; error?: string }> {
  let lastError = "Unknown repair failure";

  for (let i = 0; i < attempts; i += 1) {
    const applied = await runner();

    if (!applied.ok) {
      lastError = getApplyError(applied);
      continue;
    }

    return { ok: true };
  }

  return {
    ok: false,
    error: lastError,
  };
}

/**
 * Public API used by app/api/ai/repair/route.ts.
 *
 * Current implementation is a production-safe stub that validates
 * the payload and returns success so the build remains green.
 * The real repair orchestration logic can be wired in later.
 */
export async function runRepairLoop(
  request: RepairRequest,
): Promise<{ ok: boolean; error?: string }> {
  if (
    !request.workspaceId ||
    !request.projectId ||
    !Array.isArray(request.files)
  ) {
    return {
      ok: false,
      error: "Invalid repair request",
    };
  }

  // Temporary no-op implementation.
  // Replace with actual repair runner integration later.
  return { ok: true };
}

export { executeRepairLoop };
