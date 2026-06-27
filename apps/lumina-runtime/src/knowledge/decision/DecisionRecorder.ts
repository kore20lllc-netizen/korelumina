import {
  saveDecision,
} from "./DecisionStore.js";

import type {
  Decision,
} from "./Decision.js";

export function recordDecision(
  decision: Decision,
): Decision {
  saveDecision(
    decision,
  );

  return decision;
}
