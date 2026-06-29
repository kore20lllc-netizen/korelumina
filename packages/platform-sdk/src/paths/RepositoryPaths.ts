import fs from "node:fs";
import path from "node:path";

function findUpward(
  target: string,
): string | null {
  let current = process.cwd();

  for (let i = 0; i < 8; i++) {
    const candidate = path.join(
      current,
      target,
    );

    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const parent = path.dirname(current);

    if (parent === current) {
      break;
    }

    current = parent;
  }

  return null;
}

export {
  findUpward,
};

export function getRepoRoot(): string {
  return path.resolve(
    process.cwd(),
    "..",
    "..",
  );
}

export function getProjectsRoot(): string {
  return (
    findUpward(
      path.join(
        "runtime",
        "workspaces",
        "default",
        "projects",
      ),
    ) ??
    path.resolve(
      getRepoRoot(),
      "runtime",
      "workspaces",
      "default",
      "projects",
    )
  );
}
