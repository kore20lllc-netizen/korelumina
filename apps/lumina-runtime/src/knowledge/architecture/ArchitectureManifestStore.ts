import path from "node:path";

import {
  FileStore,
  JsonStore,
} from "../index.js";
import {
  getArchitectureKnowledgeRoot,
} from "../../projects/knowledgePaths.js";
import type {
  ArchitectureManifest,
} from "./types.js";

const fileStore =
  new FileStore(
    getArchitectureKnowledgeRoot(),
  );

const jsonStore =
  new JsonStore(
    fileStore,
  );

const MANIFEST_FILE =
  "manifest.json";

export function loadArchitectureManifest(): ArchitectureManifest {
  return (
    jsonStore.read<ArchitectureManifest>(
      MANIFEST_FILE,
    ) ?? {
      documents: [],
    }
  );
}

export function saveArchitectureManifest(
  manifest: ArchitectureManifest,
) {
  jsonStore.write(
    MANIFEST_FILE,
    manifest,
  );
}

export function manifestPath() {
  return path.join(
    getArchitectureKnowledgeRoot(),
    MANIFEST_FILE,
  );
}
