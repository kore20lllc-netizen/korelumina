import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AIFile {
  path: string;
  content: string;
}

export async function POST(req: Request) {
  try {
    const { workspaceId, projectId, instruction } = await req.json();

    if (!workspaceId || !projectId || !instruction) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const projectRoot = path.join(
      process.cwd(),
      "runtime",
      "workspaces",
      workspaceId,
      "projects",
      projectId
    );

    if (!fs.existsSync(projectRoot)) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const systemPrompt = `
You are an expert TypeScript engineer.

Return ONLY valid JSON.

Format:
{
  "summary": "short description",
  "files": [
    {
      "path": "relative/path/from/project/root.ts",
      "content": "full file content"
    }
  ]
}

Rules:
- Paths must be relative
- No absolute paths
- No ".."
- No explanations outside JSON
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: instruction },
      ],
    });

    const raw = completion.choices[0].message.content || "";
    const parsed = JSON.parse(raw);

    const writtenFiles: string[] = [];

    for (const file of parsed.files as AIFile[]) {
      if (
        !file.path ||
        file.path.includes("..") ||
        path.isAbsolute(file.path)
      ) {
        continue;
      }

      const fullPath = path.join(projectRoot, file.path);
      const dir = path.dirname(fullPath);

      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fullPath, file.content, "utf8");

      writtenFiles.push(file.path);
    }

    return NextResponse.json({
      ok: true,
      summary: parsed.summary,
      filesWritten: writtenFiles,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Execution failed" },
      { status: 500 }
    );
  }
}
