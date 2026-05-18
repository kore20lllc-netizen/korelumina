import { scanProjectTree } from "./repo-context";
import { generateArchitecturePlan } from "./architecture-plan";
import { applyWithGuard } from "./apply-guard";
import { runRepairLoop } from "./repair-loop";
import { appendJournalEvent } from "./journal";
import path from "path";

export async function runTaskOrchestrator({
  workspaceId,
  projectId,
  files,
  projectRoot,
}: {
  workspaceId: string;
  projectId: string;
  files: { path: string; content: string }[];
  projectRoot: string;
}) {
  const applied = await applyWithGuard(projectRoot, files);

  appendJournalEvent({
    t: Date.now(),
    kind: "ai.task.applied",
    workspaceId,
    projectId,
    payload: applied,
  });

  if (!applied.ok) {
    const repaired = await runRepairLoop({
      workspaceId,
      projectId,
      files,
    } as any);

    appendJournalEvent({
      t: Date.now(),
      kind: "ai.task.repair",
      workspaceId,
      projectId,
      payload: repaired,
    });

    return {
      ok: true,
      applied,
      repaired,
    };
  }

  return {
    ok: true,
    applied,
  };
}
