import type {
  ExecutiveActionProposal,
} from "./ExecutiveActionProposal.js";
import type {
  DriftIncident,
} from "./DriftIncident.js";
import type {
  ExecutiveInvariant,
} from "./ExecutiveInvariant.js";

export interface ExecutiveAlignmentPolicyContext {
  proposal:
    ExecutiveActionProposal;

  invariants:
    readonly ExecutiveInvariant[];
}

export interface ExecutiveAlignmentPolicy {
  id: string;

  evaluate(
    context:
      ExecutiveAlignmentPolicyContext,
  ): readonly DriftIncident[];
}
