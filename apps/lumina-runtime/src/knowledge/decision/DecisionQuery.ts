import {
  listDecisions,
  loadDecision,
} from "./DecisionStore.js";

import type {
  Decision,
  DecisionCategory,
  DecisionStatus,
} from "./Decision.js";

export function findDecision(
  id: string,
): Decision | null {
  return loadDecision(
    id,
  );
}

export function findDecisionsByStatus(
  status: DecisionStatus,
): Decision[] {
  return listDecisions().filter(
    (decision) =>
      decision.status === status,
  );
}

export function findDecisionsByCategory(
  category: DecisionCategory,
): Decision[] {
  return listDecisions().filter(
    (decision) =>
      decision.category === category,
  );
}

export function findDecisionsByRepository(
  repositoryId: string,
): Decision[] {
  return listDecisions().filter(
    (decision) =>
      decision.repositoryId === repositoryId,
  );
}

export function findDecisionsByProject(
  projectId: string,
): Decision[] {
  return listDecisions().filter(
    (decision) =>
      decision.projectId === projectId,
  );
}

export function listApprovedDecisions(): Decision[] {
  return findDecisionsByStatus(
    "approved",
  );
}

export function listSupersededDecisions(): Decision[] {
  return findDecisionsByStatus(
    "superseded",
  );
}
