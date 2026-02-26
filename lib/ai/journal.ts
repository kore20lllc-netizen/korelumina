import fs from "fs";
import path from "path";

export type AiJournalEvent = {
  t: number;
  kind:
    | "ai.scaffold.request"
    | "ai.scaffold.response"
    | "ai.apply.request"
    | "ai.apply.result"
    | "ai.repair.request"
    | "ai.repair.result"
    | "ai.task.request"
    | "ai.task.generated"
    | "ai.task.applied"
    | "ai.task.repair";
  workspaceId: string;
  projectId: string;
  payload?: any;
};

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

export function journalPath(workspaceId: string, projectId: string) {
  const root = process.cwd();
  return path.join(root, "runtime", "ai-journal", workspaceId, `${projectId}.jsonl`);
}

export function appendJournalEvent(evt: AiJournalEvent) {
  const file = journalPath(evt.workspaceId, evt.projectId);
  ensureDir(path.dirname(file));
  fs.appendFileSync(file, JSON.stringify(evt) + "\n", "utf8");
}

export function readJournal(
  workspaceId: string,
  projectId: string,
  limit: number = 200
): AiJournalEvent[] {
  const file = journalPath(workspaceId, projectId);
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split("\n").filter(Boolean);
  const tail = lines.slice(Math.max(0, lines.length - limit));

  const out: AiJournalEvent[] = [];

  for (const line of tail) {
    try {
      out.push(JSON.parse(line));
    } catch {
      // skip invalid lines
    }
  }

  return out;
}
