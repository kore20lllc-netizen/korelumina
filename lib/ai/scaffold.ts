import OpenAI from "openai";
import { enforceManifestGate } from "@/lib/manifest-enforce";
import { applyWithGuard } from "@/lib/ai/apply";
import path from "path";

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

type ScaffoldOpts = {
  apiKey: string;
  workspaceId: string;
  projectId: string;
  spec: string;
};

export async function runScaffold(opts: ScaffoldOpts) {
  const { apiKey, workspaceId, projectId, spec } = opts;

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

  // ✅ Manifest gate now requires paths
  enforceManifestGate({
    workspaceId,
    projectId,
    paths: files.map(f => f.path),
  });

  const projectRoot = resolveProjectRoot(workspaceId, projectId);

  const applied = await applyWithGuard(projectRoot, files);

  return applied;
}

function cleanPath(p: string) {
  let s = String(p).trim();

  if (s.startsWith("FILE:")) s = s.slice(5).trim();
  s = s.replace(/`+/g, "");
  s = s.replace(/^\/+/, "");
  s = s.replace(/\\/g, "/");

  if (!s.startsWith("src/")) {
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
