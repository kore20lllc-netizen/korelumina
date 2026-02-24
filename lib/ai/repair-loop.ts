import path from "path";
import fs from "fs";
import { enforceManifestGate } from "@/lib/manifest-enforce";
import { runCompileGuard } from "@/lib/ai/compile-guard";

export type ApplyFileChange = {
  path: string;
  content: string;
};

export type RepairRequest = {
  workspaceId: string;
  projectId: string;
  maxAttempts?: number;
  files: ApplyFileChange[];
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

export async function repairLoop(body: RepairRequest) {
  const { workspaceId, projectId, files } = body;

  if (!workspaceId || !projectId || !files?.length) {
    return { ok: false, error: "Invalid repair payload" };
  }

  const projectRoot = resolveProjectRoot(workspaceId, projectId);

  if (!fs.existsSync(projectRoot)) {
    return { ok: false, error: "Project not found" };
  }

  try {
    // ✅ PASS STRING ARRAY ONLY
    enforceManifestGate(files.map(f => f.path));
  } catch (err: any) {
    return {
      ok: false,
      attempts: [
        {
          attempt: 0,
          applied: false,
          compiled: false,
          rollback: false,
          tscOutput: err?.message ?? "Manifest rejected initial files"
        }
      ],
      final: {
        compiled: false,
        tscOutput: err?.message ?? "Manifest rejected"
      }
    };
  }

  // Apply changes
  for (const change of files) {
    const fullPath = path.join(projectRoot, change.path);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, change.content, "utf8");
  }

  const compile = await runCompileGuard(projectRoot);

  if (!compile.ok) {
    return {
      ok: false,
      attempts: [
        {
          attempt: 1,
          applied: true,
          compiled: false,
          rollback: false,
          tscOutput: compile.error ?? "Compile failed"
        }
      ],
      final: {
        compiled: false,
        tscOutput: compile.error ?? "Compile failed"
      }
    };
  }

  return {
    ok: true,
    attempts: [],
    final: { compiled: true }
  };
}
