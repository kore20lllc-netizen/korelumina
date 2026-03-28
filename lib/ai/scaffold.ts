import OpenAI from "openai";
import { applyWithGuard } from "@/lib/ai/apply";
import { enforceManifestGate } from "@/lib/manifest-enforce";
import path from "path";

type ApplyFileChange = { path: string; content: string };

export function resolveProjectRoot(workspaceId: string, projectId: string) {
  return path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    workspaceId,
    "projects",
    projectId
  );
}

// Parse strict FILE blocks produced by the model
export function parseFileBlocks(text: string): ApplyFileChange[] {
  const lines = text.split(/\r?\n/);
  const files: ApplyFileChange[] = [];

  let i = 0;

  const startsWithLabel = (line: string, label: string) =>
    line.startsWith(label);

  while (i < lines.length) {
    const line = lines[i];

    if (!startsWithLabel(line, "FILE:")) {
      i++;
      continue;
    }

    const filePath = line.slice("FILE:".length).trim();
    i++;

    // optional ACTION:
    if (i < lines.length && startsWithLabel(lines[i], "ACTION:")) {
      i++;
    }

    // require CONTENT:
    if (i >= lines.length || !startsWithLabel(lines[i], "CONTENT:")) {
      // malformed block; skip
      continue;
    }

    i++; // first content line

    const contentLines: string[] = [];
    while (i < lines.length) {
      const l = lines[i];
      if (startsWithLabel(l, "FILE:")) break;
      contentLines.push(l);
      i++;
    }

    const content = contentLines.join("\n");
    if (filePath) files.push({ path: filePath, content });
  }

  return files;
}

export async function scaffoldProject(opts: {
  apiKey: string;
  workspaceId: string;
  projectId: string;
  spec: string;
}) {
  const { apiKey, workspaceId, projectId, spec } = opts;

  enforceManifestGate({ workspaceId, projectId });

  const client = new OpenAI({ apiKey });

  const completion = await client.responses.create({
    model: "gpt-4.1-mini",
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

  const output = completion.output_text ?? "";
  const files = parseFileBlocks(output);

  // Basic safety: only allow src/
  for (const f of files) {
    if (!f.path.startsWith("src/")) {
      throw new Error(`Path not allowed by scaffold rules: ${f.path}`);
    }
  }

  const projectRoot = resolveProjectRoot(workspaceId, projectId);
  const applied = await applyWithGuard(projectRoot, files);

  // ApplyResult is not a discriminated union in your current lib/ai/apply.ts,
  // so treat error as optional.
  const maybeError =
    typeof (applied as any)?.error === "string" ? (applied as any).error : undefined;

  return {
    ok: Boolean((applied as any)?.ok),
    compiled: Boolean((applied as any)?.compiled),
    rolledBack: Boolean((applied as any)?.rolledBack),
    backupId: (applied as any)?.backupId,
    createdFiles: files.map((f) => f.path),
    ...(maybeError ? { error: maybeError } : {}),
    output,
  };
}
