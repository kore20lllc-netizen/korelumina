import fs from "node:fs";
import path from "node:path";
import { getProjectMetadata } from "./projectMetadataStore.js";

function findProjectsRoot() {
  let current =
    process.cwd();

  for (let i = 0; i < 8; i++) {
    const candidate =
      path.join(
        current,
        "runtime",
        "workspaces",
        "default",
        "projects",
      );

    if (
      fs.existsSync(candidate)
    ) {
      return candidate;
    }

    const parent =
      path.dirname(current);

    if (
      parent === current
    ) {
      break;
    }

    current = parent;
  }

  return path.resolve(
    process.cwd(),
    "..",
    "..",
    "runtime",
    "workspaces",
    "default",
    "projects",
  );
}

const PROJECTS_ROOT =
  findProjectsRoot();

export function listProjects() {
  if (
    !fs.existsSync(
      PROJECTS_ROOT,
    )
  ) {
    return [];
  }

  return fs
    .readdirSync(PROJECTS_ROOT, {
      withFileTypes: true,
    })
    .filter((entry) =>
      entry.isDirectory(),
    )
    .filter((entry) =>
      /^[a-zA-Z0-9._-]+$/.test(
        entry.name,
      ),
    )
    .map((entry) => {
      const projectPath =
        path.join(
          PROJECTS_ROOT,
          entry.name,
        );
      const metadata =
        getProjectMetadata(
          entry.name,
        );

      return {
        ...metadata,
        projectId: entry.name,
        path: projectPath,
        hasPackageJson:
          fs.existsSync(
            path.join(
              projectPath,
              "package.json",
            ),
          ),
      };
    });
}
