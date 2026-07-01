import {
  FileStore,
  JsonStore,
} from "../index.js";

import {
  getKnowledgeRoot,
} from "../../projects/knowledgePaths.js";

import type {
  MilestoneManifest,
} from "./MilestoneManifest.js";

const store = new JsonStore(
  new FileStore(
    `${getKnowledgeRoot()}/milestones`,
  ),
);

export function loadMilestoneManifest(): MilestoneManifest {
  return (
    store.read<MilestoneManifest>(
      "manifest.json",
    ) ?? { milestones: [] }
  );
}

export function saveMilestoneManifest(
  manifest: MilestoneManifest,
) {
  store.write(
    "manifest.json",
    manifest,
  );
}
