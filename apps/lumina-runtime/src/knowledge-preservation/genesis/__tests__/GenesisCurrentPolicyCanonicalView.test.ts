import assert from "node:assert/strict";
import test from "node:test";

import type {
  CanonicalKnowledgeItem,
} from "../../../canonical-knowledge/index.js";

import {
  GenesisCurrentPolicyCanonicalView,
} from "../GenesisCurrentPolicyCanonicalView.js";

import type {
  GenesisHistoricalOutputGovernanceProjection,
} from "../GenesisHistoricalOutputGovernance.js";


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

const driftOne =
  canonical(
    "canonical:drift-one",
  );

const driftTwo =
  canonical(
    "canonical:drift-two",
  );


const governance:
  GenesisHistoricalOutputGovernanceProjection = {
    projectionId:
      "genesis-historical-output-governance:fixture",

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
          "evidence:drift-one",

        packageId:
          "KP-drift-one",

        canonicalKnowledgeIds: [
          driftOne.id,
        ],

        organizationalMemoryRecordIds: [
          "memory:drift-one",
        ],

        currentClassification:
          "requires-governance-review",

        currentKnowledgeManufacturingAuthorized:
          false,

        currentPolicyStatus:
          "historical-output-not-currently-authorized",

        historicalOutputPreserved:
          true,

        reasons: [
          "Current governance no longer authorizes Knowledge manufacturing.",
        ],
      },

      {
        evidenceId:
          "evidence:drift-two",

        packageId:
          "KP-drift-two",

        canonicalKnowledgeIds: [
          driftTwo.id,
        ],

        organizationalMemoryRecordIds:
          [],

        currentClassification:
          "historical-correlation-eligible",

        currentKnowledgeManufacturingAuthorized:
          false,

        currentPolicyStatus:
          "historical-output-not-currently-authorized",

        historicalOutputPreserved:
          true,

        reasons: [
          "Current governance no longer authorizes Knowledge manufacturing.",
        ],
      },

      {
        evidenceId:
          "evidence:no-output",

        packageId:
          "KP-no-output",

        canonicalKnowledgeIds:
          [],

        organizationalMemoryRecordIds:
          [],

        currentClassification:
          "historical-evidence-only",

        currentKnowledgeManufacturingAuthorized:
          false,

        currentPolicyStatus:
          "historical-output-not-currently-authorized",

        historicalOutputPreserved:
          true,

        reasons:
          [],
      },
    ],

    summary: {
      historicalOutputs:
        4,

      currentPolicyAuthorized:
        1,

      historicalOutputsNotCurrentlyAuthorized:
        3,

      currentGovernanceUnavailable:
        0,

      packagedHistoricalOutputs:
        4,

      canonicalHistoricalOutputs:
        3,

      memoryCorrelatedHistoricalOutputs:
        1,
    },
  };


test(
  "current-policy canonical view suppresses only canonical outputs withdrawn by current governance",
  () => {
    const source = {
      list:
        () => [
          current,
          driftOne,
          driftTwo,
        ],
    };

    const view =
      new GenesisCurrentPolicyCanonicalView(
        source,
        governance,
      );

    assert.deepEqual(
      view
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
      view.suppressedIds(),
      [
        driftOne.id,
        driftTwo.id,
      ],
    );
  },
);


test(
  "current-policy view does not mutate the authoritative canonical store",
  () => {
    const values = [
      current,
      driftOne,
      driftTwo,
    ];

    const source = {
      list:
        () =>
          values,
    };

    const view =
      new GenesisCurrentPolicyCanonicalView(
        source,
        governance,
      );

    view.list();

    assert.deepEqual(
      source
        .list()
        .map(
          item =>
            item.id,
        ),
      [
        current.id,
        driftOne.id,
        driftTwo.id,
      ],
    );
  },
);


test(
  "non-canonical historical outputs do not create suppression identities",
  () => {
    const view =
      new GenesisCurrentPolicyCanonicalView(
        {
          list:
            () => [
              current,
            ],
        },
        governance,
      );

    assert.equal(
      view
        .suppressedIds()
        .includes(
          "evidence:no-output",
        ),
      false,
    );
  },
);


test(
  "suppression is derived from current policy status rather than classification name",
  () => {
    const view =
      new GenesisCurrentPolicyCanonicalView(
        {
          list:
            () => [
              current,
              driftOne,
              driftTwo,
            ],
        },
        governance,
      );

    assert.equal(
      view
        .suppressedIds()
        .includes(
          driftTwo.id,
        ),
      true,
    );
  },
);
