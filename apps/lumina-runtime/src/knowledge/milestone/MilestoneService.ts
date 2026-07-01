import {
  loadMilestone,
  saveMilestone,
} from "./MilestoneStore.js";

import type {
  Milestone,
} from "./Milestone.js";

export function createMilestone(
  milestone: Milestone,
) {
  if (loadMilestone(milestone.id)) {
    throw new Error("milestone_exists");
  }

  saveMilestone(milestone);

  return milestone;
}

export function updateMilestone(
  milestone: Milestone,
) {
  const existing =
    loadMilestone(milestone.id);

  if (!existing) {
    throw new Error("milestone_not_found");
  }

  saveMilestone({
    ...milestone,
    startedAt:
      existing.startedAt,
  });

  return loadMilestone(milestone.id);
}

export function getMilestone(
  id: string,
) {
  return loadMilestone(id);
}
