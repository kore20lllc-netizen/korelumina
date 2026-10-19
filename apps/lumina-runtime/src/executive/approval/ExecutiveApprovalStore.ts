import fs from "node:fs";
import path from "node:path";

import {
  resolveExecutiveStoragePath,
} from "../storage/resolveExecutiveStorageRoot.js";

import type {
  ExecutiveApproval,
} from "./ExecutiveApproval.js";

/*
 * KO-6 (F-23): resolved on each use, in the repository's runtime/executive.
 */
function storeRoot(): string {
  return resolveExecutiveStoragePath(
    "approvals",
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


export function saveExecutiveApproval(
  approval:
    ExecutiveApproval,
): void {
  ensureRoot();

  fs.writeFileSync(
    filePath(
      approval.id,
    ),
    JSON.stringify(
      approval,
      null,
      2,
    ),
    "utf8",
  );
}


export function loadExecutiveApproval(
  id:
    string,
): ExecutiveApproval | null {
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
  ) as ExecutiveApproval;
}


export function listExecutiveApprovals():
  ExecutiveApproval[] {
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
        ) as ExecutiveApproval,
    );
}
