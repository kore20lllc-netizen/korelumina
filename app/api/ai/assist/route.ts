import { NextResponse } from "next/server";
import OpenAI from "openai";
import path from "path";
import type { AiMode } from "@/lib/ai/types";
import { parseStrictJson } from "@/lib/ai/parse";
import { validateAiResponse } from "@/lib/ai/manifest";
import { generateDiff } from "@/lib/ai/diff";

export const dynamic = "force-dynamic";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AssistRequest {
  task: string;
  mode: AiMode;
  workspaceId?: string;
  projectId?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AssistRequest;

    if (!body.task || !body.mode) {
      return NextResponse.json(
        { error: "Missing task or mode" },
        { status: 400 }
      );
    }

    const systemPrompt = `
You are Korelumina AI.

Return JSON only.
No markdown.
No explanation text.

{
  "summary": string,
  "files": [
    {
      "path": string,
      "content": string
    }
  ]
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-5",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: body.task },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = parseStrictJson(raw);
    validateAiResponse(parsed, body.mode);

    // Resolve workspace root
    const root = process.cwd();
    const workspaceRoot =
      body.workspaceId && body.projectId
        ? path.join(
            root,
            "runtime",
            "workspaces",
            body.workspaceId,
            "projects",
            body.projectId
          )
        : root;

    const diff = generateDiff(workspaceRoot, parsed.files);

    return NextResponse.json({
      ok: true,
      summary: parsed.summary,
      diff,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "AI error" },
      { status: 500 }
    );
  }
}
