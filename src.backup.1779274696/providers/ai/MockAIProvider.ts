import { uid } from "@/lib/persistence";
import { AppError } from "@/lib/errors";
import type { AIProvider, BuildStepEvent, DraftResult, FileDiff } from "@/providers/types";

const STEP_TEMPLATE = [
  "Reading project structure",
  "Planning component changes",
  "Generating files",
  "Applying styling tokens",
  "Wiring data layer",
  "Running type checks",
];

function snippetsFor(prompt: string): FileDiff[] {
  const p = prompt.toLowerCase();
  const out: FileDiff[] = [];
  const add = (path: string, after: string) => out.push({ path, before: "", after, kind: "add" });
  add("src/components/Generated.tsx", `export function Generated() {\n  return <div className=\"p-6\">${prompt.slice(0, 80).replace(/[<>]/g, "")}</div>;\n}\n`);
  if (p.includes("auth") || p.includes("login")) add("src/lib/auth-helpers.ts", "export const isAuthed = () => true;\n");
  if (p.includes("dashboard")) add("src/pages/Dashboard.tsx", "export default function Dashboard(){return <div>Dashboard</div>}\n");
  if (p.includes("api") || p.includes("data")) add("src/services/generated-api.ts", "export async function fetchAll(){return []}\n");
  return out;
}

export class MockAIProvider implements AIProvider {
  async orchestrate({ prompt, onEvent, signal }: { projectId: string; prompt: string; onEvent?: (e: BuildStepEvent) => void; signal?: AbortSignal }): Promise<DraftResult> {
    if (!prompt.trim()) throw new AppError("VALIDATION", "Prompt cannot be empty.");
    const steps: BuildStepEvent[] = [];
    for (const label of STEP_TEMPLATE) {
      if (signal?.aborted) throw new AppError("AI_FAILED", "Generation canceled.");
      const ev: BuildStepEvent = { id: uid("step"), label, status: "running", at: Date.now() };
      steps.push(ev); onEvent?.(ev);
      await new Promise((r) => setTimeout(r, 350 + Math.random() * 450));
      const done: BuildStepEvent = { ...ev, status: "done", at: Date.now() };
      steps[steps.length - 1] = done; onEvent?.(done);
    }
    const diffs = snippetsFor(prompt);
    return {
      id: uid("draft"),
      summary: `Generated ${diffs.length} file${diffs.length === 1 ? "" : "s"} for: ${prompt.slice(0, 60)}`,
      steps, diffs,
      explanation: `Created ${diffs.length} files based on your prompt. Review the diff and apply when ready.`,
    };
  }
  async applyDraft(_projectId: string, _draftId: string) {
    await new Promise((r) => setTimeout(r, 200));
    return { ok: true as const };
  }
}