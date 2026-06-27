import {
  FileStore,
  JsonStore,
  KnowledgeStore,
} from "../index.js";

import {
  getRepositoryKnowledgeRoot,
} from "../../projects/knowledgePaths.js";

import type {
  RepositoryManifest,
} from "./RepositoryManifest.js";

const fileStore =
  new FileStore(
    getRepositoryKnowledgeRoot(),
  );

const jsonStore =
  new JsonStore(
    fileStore,
  );

const store =
  new KnowledgeStore(
    jsonStore,
  );

export function saveRepositoryManifest(
  manifest: RepositoryManifest,
) {
  store.save({
    id: manifest.id,
    type: "repository-manifest",
    version: 1,
    createdAt: manifest.analyzedAt,
    updatedAt: manifest.analyzedAt,
    data: manifest,
  });
}

export function loadRepositoryManifest(
  id: string,
): RepositoryManifest | null {
  const record =
    store.load<RepositoryManifest>(
      id,
    );

  return record?.data ?? null;
}
