import fs from "node:fs";
import path from "node:path";

import {
  resolveExecutiveStoragePath,
} from "../storage/resolveExecutiveStorageRoot.js";

import type {
  ExecutiveDecision,
} from "./ExecutiveDecision.js";

/*
 * KO-6 (F-23): resolved on each use, in the repository's runtime/executive.
 */
function storeRoot(): string {
  return resolveExecutiveStoragePath(
    "decisions",
  );
}


function ensureRoot(): void {
  fs.mkdirSync(
    storeRoot(),
    {
      recursive:
        true,
    },
  );
}


function filePath(
  id:
    string,
): string {
  return path.join(
    storeRoot(),
    `${encodeURIComponent(
      id,
    )}.json`,
  );
}


export function saveExecutiveDecision(
  decision:
    ExecutiveDecision,
): void {
  ensureRoot();

  fs.writeFileSync(
    filePath(
      decision.id,
    ),
    JSON.stringify(
      decision,
      null,
      2,
    ),
    "utf8",
  );
}


export function loadExecutiveDecision(
  id:
    string,
): ExecutiveDecision | null {
  const file =
    filePath(
      id,
    );

  if (
    !fs.existsSync(
      file,
    )
  ) {
    return null;
  }

  return JSON.parse(
    fs.readFileSync(
      file,
      "utf8",
    ),
  ) as ExecutiveDecision;
}


export function listExecutiveDecisions():
  ExecutiveDecision[] {
  if (
    !fs.existsSync(
      storeRoot(),
    )
  ) {
    return [];
  }

  return fs
    .readdirSync(
      storeRoot(),
    )
    .filter(
      name =>
        name.endsWith(
          ".json",
        ),
    )
    .map(
      name =>
        JSON.parse(
          fs.readFileSync(
            path.join(
              storeRoot(),
              name,
            ),
            "utf8",
          ),
        ) as ExecutiveDecision,
    );
}
