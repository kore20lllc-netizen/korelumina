import fs from "node:fs";
import path from "node:path";

import {
  resolveExecutiveStoragePath,
} from "../storage/resolveExecutiveStorageRoot.js";
import type {
  ExecutiveReasoning,
} from "./ExecutiveReasoning.js";

/*
 * KO-6 (F-23): Chief Agent reasoning is part of the executive record, next
 * to the decisions and approvals it produces. It was memory-only and lost
 * whenever the Runtime restarted.
 */
export interface ExecutiveReasoningStore {
  save(reasoning: ExecutiveReasoning): void;
  load(id: string): ExecutiveReasoning | null;
  list(): ExecutiveReasoning[];
}

export class FileExecutiveReasoningStore
  implements ExecutiveReasoningStore
{
  constructor(
    private readonly rootDirectory: () => string = () =>
      resolveExecutiveStoragePath("reasoning"),
  ) {}

  private filePath(id: string): string {
    return path.join(
      this.rootDirectory(),
      `${encodeURIComponent(id)}.json`,
    );
  }

  save(reasoning: ExecutiveReasoning): void {
    const root = this.rootDirectory();
    fs.mkdirSync(root, { recursive: true });
    const target = this.filePath(reasoning.id);
    const temporary = `${target}.${process.pid}.tmp`;
    fs.writeFileSync(
      temporary,
      `${JSON.stringify(reasoning, null, 2)}\n`,
      "utf8",
    );
    fs.renameSync(temporary, target);
  }

  load(id: string): ExecutiveReasoning | null {
    try {
      return Object.freeze(
        JSON.parse(
          fs.readFileSync(this.filePath(id), "utf8"),
        ),
      ) as ExecutiveReasoning;
    } catch {
      return null;
    }
  }

  list(): ExecutiveReasoning[] {
    let names: string[];
    try {
      names = fs.readdirSync(this.rootDirectory());
    } catch {
      return [];
    }
    return names
      .filter((name) => name.endsWith(".json"))
      .map((name) =>
        this.load(decodeURIComponent(name.slice(0, -5))),
      )
      .filter(
        (value): value is ExecutiveReasoning => value !== null,
      );
  }
}
