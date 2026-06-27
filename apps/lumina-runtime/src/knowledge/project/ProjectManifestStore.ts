import {
  FileStore,
  JsonStore,
  KnowledgeStore,
} from "../index.js";

import {
  getProjectKnowledgeRoot,
} from "../../projects/knowledgePaths.js";

import type {
  ProjectManifest,
} from "./ProjectManifest.js";

const fileStore =
  new FileStore(
    getProjectKnowledgeRoot(),
  );

const jsonStore =
  new JsonStore(
    fileStore,
  );

const store =
  new KnowledgeStore(
    jsonStore,
  );

export function saveProjectManifest(
  manifest: ProjectManifest,
) {
  store.save({
    id: manifest.id,
    type: "project-manifest",
    version: 1,
    createdAt:
      manifest.createdAt,
    updatedAt:
      manifest.updatedAt,
    data: manifest,
  });
}

export function loadProjectManifest(
  id: string,
): ProjectManifest | null {
  const record =
    store.load<ProjectManifest>(
      id,
    );

  return record?.data ?? null;
}
