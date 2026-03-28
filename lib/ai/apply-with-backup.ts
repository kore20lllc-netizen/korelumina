import { safeWrite } from "@/lib/ai/safe-write";
import { resolveProjectRoot } from "@/lib/runtime/guardrails";

export type ApplyFileChange = {
  path: string;
  content: string;
};

export async function applyWithBackup(
  workspaceId: string,
  projectId: string,
  files: ApplyFileChange[]
) {
  const root = resolveProjectRoot(workspaceId, projectId);

  const written: string[] = [];

  for (const f of files) {
    const rel = f.path.replace(/^\/+/, "");
    safeWrite(root, rel, String(f.content ?? ""));
    written.push(rel);
  }

  return {
    ok: true,
    written,
  };
}
