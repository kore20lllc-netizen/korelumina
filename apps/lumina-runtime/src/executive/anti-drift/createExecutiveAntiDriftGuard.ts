import {
  createBuiltInExecutiveAlignmentPolicies,
} from "./BuiltInExecutiveAlignmentPolicies.js";
import {
  ExecutiveAntiDriftGuard,
} from "./ExecutiveAntiDriftGuard.js";
import {
  KORELUMINA_EXECUTIVE_INVARIANTS,
} from "./ExecutiveInvariant.js";

export function createExecutiveAntiDriftGuard():
  ExecutiveAntiDriftGuard {
  return new ExecutiveAntiDriftGuard({
    invariants:
      KORELUMINA_EXECUTIVE_INVARIANTS,

    policies:
      createBuiltInExecutiveAlignmentPolicies(),
  });
}
