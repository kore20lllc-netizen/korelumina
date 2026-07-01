import {
  FileStore,
  JsonStore,
} from "../index.js";

import {
  getKnowledgeRoot,
} from "../../projects/knowledgePaths.js";

import type {
  Milestone,
} from "./Milestone.js";

const store = new JsonStore(
  new FileStore(
    `${getKnowledgeRoot()}/milestones`,
  ),
);

export function saveMilestone(
  milestone: Milestone,
) {
  store.write(
    `${milestone.id}.json`,
    milestone,
  );
}

export function loadMilestone(
  id: string,
): Milestone | null {
  return store.read<Milestone>(
    `${id}.json`,
  );
}

export function listMilestoneFiles(): string[] {
  return store
    .list()
    .filter(
      (file) =>
        file.endsWith(".json") &&
        file !== "manifest.json",
    );
}
