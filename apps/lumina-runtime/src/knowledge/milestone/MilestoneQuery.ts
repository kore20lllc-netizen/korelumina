import {
  listMilestoneFiles,
  loadMilestone,
} from "./MilestoneStore.js";

import type {
  Milestone,
} from "./Milestone.js";

export function listMilestones(): Milestone[] {
  return listMilestoneFiles()
    .map((file) =>
      loadMilestone(file.replace(/\.json$/, "")),
    )
    .filter(
      (milestone): milestone is Milestone =>
        milestone !== null,
    );
}

export function findMilestone(
  id: string,
): Milestone | null {
  return loadMilestone(id);
}

export function findMilestonesByStatus(
  status: Milestone["status"],
): Milestone[] {
  return listMilestones().filter(
    (milestone) =>
      milestone.status === status,
  );
}

export function findMilestonesByTag(
  tag: string,
): Milestone[] {
  return listMilestones().filter(
    (milestone) =>
      milestone.tag === tag,
  );
}

export function findMilestonesByCommit(
  commit: string,
): Milestone[] {
  return listMilestones().filter(
    (milestone) =>
      milestone.commit === commit,
  );
}

export function findMilestonesByAdr(
  adrId: string,
): Milestone[] {
  return listMilestones().filter(
    (milestone) =>
      milestone.adrIds.includes(adrId),
  );
}
