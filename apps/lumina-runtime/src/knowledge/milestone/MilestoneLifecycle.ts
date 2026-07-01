import {
  getMilestone,
  updateMilestone,
} from "./MilestoneService.js";

export function activateMilestone(
  id: string,
) {
  const milestone =
    getMilestone(id);

  if (!milestone) {
    throw new Error("milestone_not_found");
  }

  return updateMilestone({
    ...milestone,
    status: "active",
  });
}

export function completeMilestone(
  id: string,
) {
  const milestone =
    getMilestone(id);

  if (!milestone) {
    throw new Error("milestone_not_found");
  }

  return updateMilestone({
    ...milestone,
    status: "completed",
    completedAt:
      milestone.completedAt ??
      Date.now(),
    validated: true,
  });
}
