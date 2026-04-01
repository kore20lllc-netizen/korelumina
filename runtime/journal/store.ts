import fs from "fs/promises";
import path from "path";

export async function getJournal(projectId: string) {
  try {
    const file = path.join(
      process.cwd(),
      "runtime",
      "workspaces",
      "default",
      "projects",
      projectId,
      "journal.json"
    );

    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
