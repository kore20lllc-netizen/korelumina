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

    // Manifest gate must receive paths. Enforce AFTER parsing.
    enforceManifestGate({
      workspaceId,
      projectId,
      paths: files.map((f) => f.path)
    });

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

function cleanPath(p: string) {
  // Remove accidental markdown/code-fence junk
  let s = String(p).trim();

  // Drop leading "FILE:" if model repeats it
  if (s.startsWith("FILE:")) s = s.slice(5).trim();

  // Remove backticks and stray fence prefixes like ```src/...
  s = s.replace(/`+/g, "");
  s = s.replace(/^\/+/, ""); // no absolute
  s = s.replace(/\\/g, "/"); // windows -> posix

  // Hard rule: src/ only
  if (!s.startsWith("src/")) {
    // allow "src" exact? normalize to "src/.."
    if (s === "src") s = "src/";
    else throw new Error(`Scaffold path must start with src/: ${p}`);
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
    files.push({ path: filePath, content });
  }

  return files;
}
