import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

import { enforceManifestGate } from "@/lib/manifest-enforce";
import { appendJournalEvent } from "@/lib/ai/journal";
import { applyWithGuard } from "@/lib/ai/apply";
import { runRepairLoop } from "@/lib/ai/repair-loop";

export const dynamic = "force-dynamic";

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

function parseFileBlocks(text: string) {
  const blocks = text.split("FILE:");
  const files: { path: string; content: string }[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const firstLineEnd = trimmed.indexOf("\n");
    if (firstLineEnd === -1) continue;

    const filePath = trimmed.slice(0, firstLineEnd).trim();
    const content = trimmed.slice(firstLineEnd + 1);

    files.push({ path: filePath, content });
  }

  return files;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const workspaceId = body?.workspaceId as string | undefined;
    const projectId = body?.projectId as string | undefined;
    const mode = (body?.mode as string) || "draft";
    const maxAttempts = Number(body?.maxAttempts ?? 2);

    if (!workspaceId || !projectId) {
      return NextResponse.json(
        { error: "workspaceId and projectId are required" },
        { status: 400 }
      );
    }

    let files: { path: string; content: string }[] = [];

    // --- Generate from spec ---
    if (typeof body?.spec === "string") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: "OPENAI_API_KEY missing" },
          { status: 500 }
        );
      }

      const client = new OpenAI({ apiKey });

      const completion = await client.responses.create({
        model: "gpt-4.1-mini",
        input: `
You are a code generator.

Generate FILE blocks only.

Rules:
- Only write inside src/
- Never write README.md
- Never write package.json
- Never write root files

Task:
${body.spec}
`.trim(),
      });

      const outputText = completion.output_text ?? "";
      files = parseFileBlocks(outputText);

      appendJournalEvent({
        t: Date.now(),
        kind: "ai.task.generated",
        workspaceId,
        projectId,
        payload: { fileCount: files.length },
      });
    }
    // --- Direct files ---
    else if (Array.isArray(body?.files)) {
      files = body.files;
    } else {
      return NextResponse.json(
        { error: "Provide either files[] or spec" },
        { status: 400 }
      );
    }

    // --- Manifest safety ---
    enforceManifestGate({
      workspaceId,
      projectId,
      paths: files.map(f => f.path),
    });

    if (mode === "draft") {
      return NextResponse.json({ ok: true, mode, files });
    }

    const projectRoot = resolveProjectRoot(workspaceId, projectId);

    if (!fs.existsSync(projectRoot)) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
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

      return NextResponse.json({
        ok: true,
        mode,
        files,
        applied,
        repaired,
      });
    }

    return NextResponse.json({
      ok: true,
      mode,
      files,
      applied,
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Task failed" },
      { status: 500 }
    );
  }
}
