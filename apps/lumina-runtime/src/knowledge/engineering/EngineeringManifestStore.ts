import path from "node:path";

import {
  FileStore,
  JsonStore,
} from "../index.js";

import {
  getEngineeringKnowledgeRoot,
} from "../../projects/knowledgePaths.js";

import type {
  EngineeringManifest,
} from "./EngineeringManifest.js";

const fileStore =
  new FileStore(
    getEngineeringKnowledgeRoot(),
  );

const jsonStore =
  new JsonStore(
    fileStore,
  );

const MANIFEST_FILE =
  "manifest.json";

export function loadEngineeringManifest(): EngineeringManifest {
  return (
    jsonStore.read<EngineeringManifest>(
      MANIFEST_FILE,
    ) ?? {
      tickets: [],
    }
  );
}

export function saveEngineeringManifest(
  manifest: EngineeringManifest,
) {
  jsonStore.write(
    MANIFEST_FILE,
    manifest,
  );
}

export function engineeringManifestPath() {
  return path.join(
    getEngineeringKnowledgeRoot(),
    MANIFEST_FILE,
  );
}
