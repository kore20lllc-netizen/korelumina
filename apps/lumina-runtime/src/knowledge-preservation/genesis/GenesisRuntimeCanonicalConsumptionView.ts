import type {
  CanonicalKnowledgeItem,
} from "../../canonical-knowledge/index.js";

import {
  GenesisCurrentPolicyCanonicalView,
} from "./GenesisCurrentPolicyCanonicalView.js";

import type {
  GenesisCanonicalConsumptionStore,
} from "./GenesisCurrentPolicyCanonicalView.js";

import type {
  GenesisHistoricalOutputGovernanceProjection,
} from "./GenesisHistoricalOutputGovernance.js";

import type {
  GenesisRuntimeReplaySelection,
} from "./GenesisRuntimeReplayDesignation.js";


export type GenesisRuntimeCanonicalConsumptionState =
  | "ACTIVE"
  | "FAIL_CLOSED";


export type GenesisRuntimeCanonicalConsumptionReason =
  | "DESIGNATED_REPLAY_CURRENT_POLICY"
  | "REPLAY_SELECTION_UNSET"
  | "REPLAY_SELECTION_INVALID"
  | "HISTORICAL_OUTPUT_GOVERNANCE_UNAVAILABLE";


export interface GenesisRuntimeCanonicalConsumptionResolution {
  state:
    GenesisRuntimeCanonicalConsumptionState;

  reason:
    GenesisRuntimeCanonicalConsumptionReason;

  store:
    GenesisCanonicalConsumptionStore;

  suppressedCanonicalIds:
    readonly string[];
}


const emptyCanonicalStore:
  GenesisCanonicalConsumptionStore = {
    list:
      (): CanonicalKnowledgeItem[] =>
        [],
  };


export function buildGenesisRuntimeCanonicalConsumptionView(
  input: {
    canonicalStore:
      GenesisCanonicalConsumptionStore;

    replaySelection:
      GenesisRuntimeReplaySelection;

    historicalOutputGovernance:
      GenesisHistoricalOutputGovernanceProjection |
      null;
  },
): GenesisRuntimeCanonicalConsumptionResolution {
  if (
    input.replaySelection.state ===
    "UNSET"
  ) {
    return {
      state:
        "FAIL_CLOSED",

      reason:
        "REPLAY_SELECTION_UNSET",

      store:
        emptyCanonicalStore,

      suppressedCanonicalIds:
        [],
    };
  }

  if (
    input.replaySelection.state ===
    "INVALID"
  ) {
    return {
      state:
        "FAIL_CLOSED",

      reason:
        "REPLAY_SELECTION_INVALID",

      store:
        emptyCanonicalStore,

      suppressedCanonicalIds:
        [],
    };
  }

  if (
    !input.historicalOutputGovernance
  ) {
    return {
      state:
        "FAIL_CLOSED",

      reason:
        "HISTORICAL_OUTPUT_GOVERNANCE_UNAVAILABLE",

      store:
        emptyCanonicalStore,

      suppressedCanonicalIds:
        [],
    };
  }

  const governed =
    new GenesisCurrentPolicyCanonicalView(
      input.canonicalStore,
      input.historicalOutputGovernance,
    );

  return {
    state:
      "ACTIVE",

    reason:
      "DESIGNATED_REPLAY_CURRENT_POLICY",

    store:
      governed,

    suppressedCanonicalIds:
      governed.suppressedIds(),
  };
}
