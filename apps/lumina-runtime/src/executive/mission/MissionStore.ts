import fs from "node:fs";
import path from "node:path";

import { resolveExecutiveStoragePath } from "../storage/resolveExecutiveStorageRoot.js";
import type { Mission } from "./Mission.js";

/*
 * MS-1: missions are committed executive records, one file each, in the
 * repository's runtime/executive/missions (isolated per test process).
 */
function root(): string {
  return resolveExecutiveStoragePath("missions");
}

function file(id: string): string {
  return path.join(root(), `${encodeURIComponent(id)}.json`);
}

export class FileMissionStore {
  save(mission: Mission): void {
    fs.mkdirSync(root(), { recursive: true });
    fs.writeFileSync(file(mission.id), `${JSON.stringify(mission, null, 2)}\n`);
  }

  get(id: string): Mission | null {
    try {
      return JSON.parse(fs.readFileSync(file(id), "utf8")) as Mission;
    } catch {
      return null;
    }
  }

  list(): Mission[] {
    if (!fs.existsSync(root())) return [];
    return fs
      .readdirSync(root())
      .filter((name) => name.endsWith(".json"))
      .map((name) => JSON.parse(fs.readFileSync(path.join(root(), name), "utf8")) as Mission)
      .sort((left, right) => left.id.localeCompare(right.id));
  }

  /* MS-YYYY-NNNN, sequential within the year. */
  nextId(year: number): string {
    const prefix = `MS-${year}-`;
    const highest = this.list()
      .map((mission) => mission.id)
      .filter((id) => id.startsWith(prefix))
      .map((id) => Number(id.slice(prefix.length)))
      .filter(Number.isFinite)
      .reduce((max, value) => Math.max(max, value), 0);
    return `${prefix}${String(highest + 1).padStart(4, "0")}`;
  }
}
