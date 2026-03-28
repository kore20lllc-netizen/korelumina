import { NextResponse } from "next/server";
import OpenAI from "openai";
import path from "path";
import { enforceManifestGate } from "@/lib/manifest-enforce";
import { applyWithGuard } from "@/lib/ai/apply";

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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const workspaceId = body?.workspaceId as string | undefined;
    const projectId = body?.projectId as string | undefined;
    const spec = body?.spec as string | undefined;

    if (!workspaceId || !projectId || !spec) {
      return NextResponse.json(
        { error: "workspaceId, projectId and spec are required" },
        { status: 400 }
      );
    }

    enforceManifestGate({ workspaceId, projectId });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
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
${spec}
`
    });

    const output = completion.output_text ?? "";

    const files = parseFileBlocks(output);

    const projectRoot = resolveProjectRoot(workspaceId, projectId);

    const applied = await applyWithGuard(projectRoot, files);

    return NextResponse.json({
      ok: true,
      applied
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Scaffold failed" },
      { status: 500 }
    );
  }
}

function parseFileBlocks(text: string) {
  const blocks = text.split("FILE:");
  const files: { path: string; content: string }[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const firstLineEnd = trimmed.indexOf("\n");
    if (firstLineEnd === -1) continue;

    const path = trimmed.slice(0, firstLineEnd).trim();
    const content = trimmed.slice(firstLineEnd + 1);

    files.push({ path, content });
  }

  return files;
}
