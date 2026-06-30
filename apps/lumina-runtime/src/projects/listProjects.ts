import path from "node:path";

import {
  fileSystem,
} from "@korelumina/platform-sdk";

import { getProjectMetadata } from "./projectMetadataStore.js";
import { getProjectsRoot } from "./workspacePaths.js";

const PROJECTS_ROOT =
  getProjectsRoot();

export function listProjects() {
  if (!fileSystem.exists(PROJECTS_ROOT)) {
    console.warn(
      "[listProjects] PROJECTS_ROOT does not exist",
      PROJECTS_ROOT,
    );

    return [];
  }

  const entries = fileSystem.listEntries(
    PROJECTS_ROOT,
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
          fileSystem.exists(
            path.join(
              projectPath,
              "package.json",
            ),
          ),
      };
    });
}
