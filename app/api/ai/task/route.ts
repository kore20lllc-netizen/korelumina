import { NextResponse } from "next/server";
import OpenAI from "openai";
import path from "path";
import fs from "fs";

import { enforceManifestGate } from "@/lib/manifest-enforce";
import { runTaskOrchestrator } from "@/lib/ai/orchestrator";

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

function cleanPath(p: string) {
  let s = String(p).trim();
  s = s.replace(/`+/g, "");
  s = s.replace(/^FILE:/, "").trim();
  s = s.replace(/^\/+/, "");
  s = s.replace(/\\/g, "/");

  if (!s.startsWith("src/")) {
    throw new Error(`Task path must start with src/: ${p}`);
  }

  return s;
}

function parseFileBlocks(text: string) {
  const blocks = text.split("FILE:");
  const files: { path: string; content: string }[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const firstLineEnd = trimmed.indexOf("\n");
    if (firstLineEnd === -1) continue;

    const rawPath = trimmed.slice(0, firstLineEnd).trim();
    const content = trimmed.slice(firstLineEnd + 1);

    const filePath = cleanPath(rawPath);

    files.push({
      path: filePath,
      content: content.trim(),
    });
  }

  return files;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const workspaceId = body?.workspaceId;
    const projectId = body?.projectId;
    const spec = body?.spec;
    const mode = body?.mode ?? "draft";
    const context = body?.context ?? {};

    if (!workspaceId || !projectId || !spec) {
      return NextResponse.json(
        { error: "workspaceId, projectId, spec required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey });

    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are a code generator.

Respond ONLY using FILE blocks.

Format:

FILE: src/path/to/file.ts
<file contents>

Rules:
- Only FILE blocks
- No explanations
- Only write inside src/

Task:
${spec}

Project Files:
${JSON.stringify(context.files ?? [], null, 2)}
`
    });

    const output = completion.output_text ?? "";
    const files = parseFileBlocks(output);

    if (!files.length) {
      return NextResponse.json(
        { error: "No FILE blocks returned" },
        { status: 400 }
      );
    }

    enforceManifestGate({
      workspaceId,
      projectId,
      paths: files.map((f) => f.path),
    });

    if (mode === "draft") {
      return NextResponse.json({
        ok: true,
        mode,
        files,
      });
    }

    const projectRoot = resolveProjectRoot(workspaceId, projectId);

    if (!fs.existsSync(projectRoot)) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const result = await runTaskOrchestrator({
      workspaceId,
      projectId,
      files,
      projectRoot,
    });

    return NextResponse.json({
  ...result,
  ok: true,
  mode: "orchestrated",
  });

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Task failed" },
      { status: 500 }
    );
  }
}
