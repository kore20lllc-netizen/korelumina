import fs from "fs";
import { NextResponse } from "next/server";
import { appendJournalEvent } from "@/lib/ai/journal";
import { applyWithGuard, resolveProjectRoot } from "@/lib/ai/apply";
import { runRepairLoop } from "@/lib/ai/repair-loop";
import type { ApplyFileChange } from "@/lib/ai/apply";
import { enforceManifestGate } from "@/lib/manifest-enforce";

export const dynamic = "force-dynamic";

type Body = {
  workspaceId?: string;
  projectId?: string;
  mode?: "draft" | "apply" | "apply_repair";
  maxAttempts?: number;
  spec?: string;
  files?: ApplyFileChange[];
};

function validateFiles(input: any): ApplyFileChange[] {
  const out: ApplyFileChange[] = [];
  if (!Array.isArray(input)) return out;
  for (const f of input) {
    const p = f?.path;
    const c = f?.content;
    if (typeof p === "string" && typeof c === "string") out.push({ path: p, content: c });
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Body | null;

    const workspaceId = body?.workspaceId || "";
    const projectId = body?.projectId || "";
    const mode = body?.mode ?? "apply";
    const maxAttempts = Math.max(1, Math.min(Number(body?.maxAttempts ?? 3) || 3, 6));

    if (!workspaceId || !projectId) {
      return NextResponse.json(
        { error: "workspaceId and projectId are required" },
        { status: 400 }
      );
    }

    // manifest gate (workspace/project scoped)
    enforceManifestGate({ workspaceId, projectId });

    const files = validateFiles(body?.files);

    if (files.length === 0) {
      return NextResponse.json({ error: "files[] are required" }, { status: 400 });
    }

    appendJournalEvent({
      t: Date.now(),
      kind: "ai.task.request",
      workspaceId,
      projectId,
      payload: { mode, maxAttempts, fileCount: files.length },
    });

    if (mode === "draft") {
      appendJournalEvent({
        t: Date.now(),
        kind: "ai.task.generated",
        workspaceId,
        projectId,
        payload: { fileCount: files.length },
      });
      return NextResponse.json({ ok: true, mode, files });
    }

    const projectRoot = resolveProjectRoot(workspaceId, projectId);
    if (!fs.existsSync(projectRoot)) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const applied = await applyWithGuard(projectRoot, files);

    appendJournalEvent({
      t: Date.now(),
      kind: "ai.task.applied",
      workspaceId,
      projectId,
      payload: applied,
    });

    if (mode === "apply_repair") {
      const repaired = await runRepairLoop({
        workspaceId,
        projectId,
        maxAttempts,
        files,
      } as any);

      appendJournalEvent({
        t: Date.now(),
        kind: "ai.task.repair",
        workspaceId,
        projectId,
        payload: repaired,
      });

      return NextResponse.json({ ok: true, mode, files, applied, repaired });
    }

    return NextResponse.json({ ok: true, mode, files, applied });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Task failed" },
      { status: 500 }
    );
  }
}
