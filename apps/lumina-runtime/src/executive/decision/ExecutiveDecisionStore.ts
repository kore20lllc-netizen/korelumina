import fs from "node:fs";
import path from "node:path";

import type {
  ExecutiveDecision,
} from "./ExecutiveDecision.js";

const root =
  path.resolve(
    process.cwd(),
    "runtime/executive/decisions",
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
        ) as ExecutiveDecision,
    );
}
