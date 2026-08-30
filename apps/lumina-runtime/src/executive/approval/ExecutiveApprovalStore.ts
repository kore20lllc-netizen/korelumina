import fs from "node:fs";
import path from "node:path";

import type {
  ExecutiveApproval,
} from "./ExecutiveApproval.js";

const root =
  path.resolve(
    process.cwd(),
    "runtime/executive/approvals",
  );


function ensureRoot(): void {
  fs.mkdirSync(
    root,
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
    root,
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
      root,
    )
  ) {
    return [];
  }

  return fs
    .readdirSync(
      root,
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
              root,
              name,
            ),
            "utf8",
          ),
        ) as ExecutiveApproval,
    );
}
