import assert from "node:assert/strict";
import test from "node:test";

import type {
  CanonicalKnowledgeItem,
} from "../../../canonical-knowledge/index.js";

import {
  buildGenesisRuntimeCanonicalConsumptionView,
} from "../GenesisRuntimeCanonicalConsumptionView.js";

import type {
  GenesisHistoricalOutputGovernanceProjection,
} from "../GenesisHistoricalOutputGovernance.js";

import type {
  GenesisRuntimeReplaySelection,
} from "../GenesisRuntimeReplayDesignation.js";


function canonical(
  id:
    string,
): CanonicalKnowledgeItem {
  return {
    id,

    type:
      "CandidateDecision",

    title:
      id,

    summary:
      id,

    confidence:
      1,

    evidenceRefs:
      [],

    relationships:
      {},

    createdAt:
      1,

    updatedAt:
      1,

    status:
      "canonical",

    metadata:
      {},
  };
}


const current =
  canonical(
    "canonical:current",
  );

const drift =
  canonical(
    "canonical:policy-drift",
  );


const governance:
  GenesisHistoricalOutputGovernanceProjection = {
    projectionId:
      "genesis-historical-output-governance:test",

    records: [
      {
        evidenceId:
          "evidence:current",

        packageId:
          "KP-current",

        canonicalKnowledgeIds: [
          current.id,
        ],

        organizationalMemoryRecordIds:
          [],

        currentClassification:
          "knowledge-seeding-eligible",

        currentKnowledgeManufacturingAuthorized:
          true,

        currentPolicyStatus:
          "current-policy-authorized",

        historicalOutputPreserved:
          true,

        reasons:
          [],
      },

      {
        evidenceId:
          "evidence:drift",

        packageId:
          "KP-drift",

        canonicalKnowledgeIds: [
          drift.id,
        ],

        organizationalMemoryRecordIds:
          [],

        currentClassification:
          "requires-governance-review",

        currentKnowledgeManufacturingAuthorized:
          false,

        currentPolicyStatus:
          "historical-output-not-currently-authorized",

        historicalOutputPreserved:
          true,

        reasons: [
          "Current policy no longer authorizes manufacturing.",
        ],
      },
    ],

    summary: {
      historicalOutputs:
        2,

      currentPolicyAuthorized:
        1,

      historicalOutputsNotCurrentlyAuthorized:
        1,

      currentGovernanceUnavailable:
        0,

      packagedHistoricalOutputs:
        2,

      canonicalHistoricalOutputs:
        2,

      memoryCorrelatedHistoricalOutputs:
        0,
    },
  };


const selected:
  GenesisRuntimeReplaySelection = {
    state:
      "SELECTED",

    replayId:
      `genesis-replay:${"a".repeat(
        64,
      )}`,

    designation: {
      designationVersion:
        "genesis-runtime-replay-designation:v1",

      replayId:
        `genesis-replay:${"a".repeat(
          64,
        )}`,

      designatedBy:
        "human:test",

      designatedAt:
        1,

      reason:
        "test",
    },

    reason:
      "DESIGNATED_REPLAY_SELECTED",
  };


test(
  "selected replay exposes current-policy canonical view",
  () => {
    const source = {
      list:
        () => [
          current,
          drift,
        ],
    };

    const result =
      buildGenesisRuntimeCanonicalConsumptionView({
        canonicalStore:
          source,

        replaySelection:
          selected,

        historicalOutputGovernance:
          governance,
      });

    assert.equal(
      result.state,
      "ACTIVE",
    );

    assert.equal(
      result.reason,
      "DESIGNATED_REPLAY_CURRENT_POLICY",
    );

    assert.deepEqual(
      result.store
        .list()
        .map(
          item =>
            item.id,
        ),
      [
        current.id,
      ],
    );

    assert.deepEqual(
      result.suppressedCanonicalIds,
      [
        drift.id,
      ],
    );

    assert.equal(
      source.list().length,
      2,
    );
  },
);


test(
  "unset replay selection fails closed instead of exposing raw canonical store",
  () => {
    const result =
      buildGenesisRuntimeCanonicalConsumptionView({
        canonicalStore: {
          list:
            () => [
              current,
              drift,
            ],
        },

        replaySelection: {
          state:
            "UNSET",

          replayId:
            null,

          designation:
            null,

          reason:
            "NO_DESIGNATION",
        },

        historicalOutputGovernance:
          governance,
      });

    assert.equal(
      result.state,
      "FAIL_CLOSED",
    );

    assert.equal(
      result.reason,
      "REPLAY_SELECTION_UNSET",
    );

    assert.deepEqual(
      result.store.list(),
      [],
    );
  },
);


test(
  "invalid replay selection fails closed instead of exposing raw canonical store",
  () => {
    const result =
      buildGenesisRuntimeCanonicalConsumptionView({
        canonicalStore: {
          list:
            () => [
              current,
              drift,
            ],
        },

        replaySelection: {
          state:
            "INVALID",

          replayId:
            null,

          designation:
            selected.designation,

          reason:
            "DESIGNATED_REPLAY_NOT_ELIGIBLE",
        },

        historicalOutputGovernance:
          governance,
      });

    assert.equal(
      result.state,
      "FAIL_CLOSED",
    );

    assert.equal(
      result.reason,
      "REPLAY_SELECTION_INVALID",
    );

    assert.deepEqual(
      result.store.list(),
      [],
    );
  },
);


test(
  "selected replay without historical-output governance fails closed",
  () => {
    const result =
      buildGenesisRuntimeCanonicalConsumptionView({
        canonicalStore: {
          list:
            () => [
              current,
              drift,
            ],
        },

        replaySelection:
          selected,

        historicalOutputGovernance:
          null,
      });

    assert.equal(
      result.state,
      "FAIL_CLOSED",
    );

    assert.equal(
      result.reason,
      "HISTORICAL_OUTPUT_GOVERNANCE_UNAVAILABLE",
    );

    assert.deepEqual(
      result.store.list(),
      [],
    );
  },
);
