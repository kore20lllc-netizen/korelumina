import { NextResponse } from "next/server";
import OpenAI from "openai";
import { appendJournalEvent } from "@/lib/ai/journal";
import { enforceManifestGate } from "@/lib/manifest-enforce";

export const dynamic = "force-dynamic";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
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

  appendJournalEvent({
    t: Date.now(),
    kind: "ai.scaffold.request",
    workspaceId,
    projectId,
    payload: { spec },
  });

  const completion = await client.responses.create({
    model: "gpt-4.1",
    input: `
You are generating file patches for a Next.js TypeScript project.

Rules:
- Only output FILE blocks.
- Only write inside src/.
- Never write README.md.
- Never write package.json.
- Never write root files.

Format strictly:

FILE: relative/path
ACTION: create|update
CONTENT:
<file content>

Task:
${spec}
`,
  });

  // ✅ Stable and fully supported by SDK
  const output = completion.output_text ?? "";

  appendJournalEvent({
    t: Date.now(),
    kind: "ai.scaffold.response",
    workspaceId,
    projectId,
    payload: { output },
  });

  return NextResponse.json({ ok: true, output });
}
