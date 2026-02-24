import fs from "fs";
import path from "path";
import { createTwoFilesPatch } from "diff";

export interface FileChange {
  path: string;
  patch: string;
}

export function generateDiff(
  workspaceRoot: string,
  files: { path: string; content: string }[]
): FileChange[] {
  const changes: FileChange[] = [];

  for (const file of files) {
    const fullPath = path.join(workspaceRoot, file.path);

    let existing = "";
    if (fs.existsSync(fullPath)) {
      existing = fs.readFileSync(fullPath, "utf8");
    }

    const patch = createTwoFilesPatch(
      file.path,
      file.path,
      existing,
      file.content,
      "",
      "",
      { context: 3 }
    );

    changes.push({
      path: file.path,
      patch,
    });
  }

  return changes;
}
