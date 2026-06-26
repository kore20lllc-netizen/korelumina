import fs from "node:fs";
import path from "node:path";

import { getProjectMetadata } from "./projectMetadataStore.js";
import { getProjectsRoot } from "./workspacePaths.js";

const PROJECTS_ROOT =
  getProjectsRoot();

export function listProjects() {
  if (!fs.existsSync(PROJECTS_ROOT)) {
    console.warn(
      "[listProjects] PROJECTS_ROOT does not exist",
      PROJECTS_ROOT,
    );

    return [];
  }

  const entries = fs.readdirSync(
    PROJECTS_ROOT,
    {
      withFileTypes: true,
    },
  );

  return entries
    .filter((entry) => entry.isDirectory())
    .filter((entry) =>
      /^[a-zA-Z0-9._-]+$/.test(
        entry.name,
      ),
    )
    .map((entry) => {
      const projectPath = path.join(
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
