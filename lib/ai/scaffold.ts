import path from "path";
import { runCompileGuard } from "@/lib/ai/compile-guard";
import { applyWithGuard } from "@/lib/ai/apply";
import { enforceManifestGate } from "@/lib/manifest-enforce";
import { parseStrictJson } from "@/lib/ai/parse";
import OpenAI from "openai";

export type ScaffoldRequest = {
  workspaceId: string;
  projectId: string;
  appName: string;
  spec: string;
  maxFiles?: number;
};

export async function runScaffold(req: ScaffoldRequest) {
  const { workspaceId, projectId, appName, spec } = req;
  const maxFiles = req.maxFiles ?? 25;

  const projectRoot = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    workspaceId,
    "projects",
    projectId
  );

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const client = new OpenAI({ apiKey });

  const system = `
You are scaffolding a feature inside an isolated project directory.

CRITICAL:
- ALL file paths MUST be relative to the project root.
- NEVER generate root-level files.
- NEVER generate paths starting with '/'.
- NEVER generate README.md at repository root.
- README must be created inside the project root.

Allowed example:
README.md
app/feature/page.tsx
app/api/contacts/route.ts

Return strict JSON:
{
  "files": [
    { "path": "relative/path", "content": "file content" }
  ]
}
  `.trim();

  const user = `
APP NAME:
${appName}

GOAL:
Scaffold the foundational structure for this app so a developer can start building features immediately.

SPEC:
${spec}

REQUIRED OUTPUT FILES (minimum set):
1) README.md (project root only)
2) One API route (e.g. app/api/contacts/route.ts)
3) One UI page (e.g. app/contacts/page.tsx)
4) Minimal example module aligned to spec

Strict JSON only.
  `.trim();

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ]
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const parsed = parseStrictJson(raw);

  const files = parsed?.files?.slice(0, maxFiles);

  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("No files generated");
  }

  // Enforce manifest safety

  const applied = await applyWithGuard(projectRoot, files);

  return {
    ok: applied.ok,
    compiled: applied.compiled,
    rolledBack: applied.rolledBack,
    backupId: applied.backupId,
    createdFiles: files.map((f: any) => f.path),
    error: applied.error
  };
}
