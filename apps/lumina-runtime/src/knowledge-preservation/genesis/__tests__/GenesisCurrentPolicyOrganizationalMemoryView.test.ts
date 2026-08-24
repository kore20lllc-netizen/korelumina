import assert from "node:assert/strict";
import test from "node:test";

import type {
  OrganizationalMemoryRecord,
} from "../../../knowledge/organizational-memory/index.js";

import {
  GenesisCurrentPolicyOrganizationalMemoryView,
} from "../GenesisCurrentPolicyOrganizationalMemoryView.js";


function memory(
  input: {
    id:
      string;

    canonicalItemId?:
      string;
  },
): OrganizationalMemoryRecord {
  return {
    id:
      input.id,

    organizationId:
      "organization:test",

    title:
      input.id,

    summary:
      input.id,

    source:
      "architecture",

    references:
      [],

    governance:
      input.canonicalItemId
        ? {
            canonicalItemId:
              input.canonicalItemId,

            provenanceRefs:
              [],

            lineage:
              [],

            dependencies:
              [],

            supersedes:
              [],

            trust: {
              canonical:
                true,

              humanApproved:
                true,

              adaptationValidated:
                true,
            },

            privacy: {
              generalized:
                true,

              customerSpecificContentRetained:
                false,
            },
          }
        : undefined,

    createdAt:
      new Date(
        0,
      ).toISOString(),
  };
}


const allowed =
  memory({
    id:
      "memory:allowed",

    canonicalItemId:
      "canonical:allowed",
  });

const drift =
  memory({
    id:
      "memory:drift",

    canonicalItemId:
      "canonical:drift",
  });

const independent =
  memory({
    id:
      "memory:independent",
  });


test(
  "active current-policy view suppresses memory whose canonical parent is suppressed",
  () => {
    const source = {
      list:
        () => [
          allowed,
          drift,
          independent,
        ],
    };

    const view =
      new GenesisCurrentPolicyOrganizationalMemoryView(
        source,
        {
          state:
            "ACTIVE",

          suppressedCanonicalIds: [
            "canonical:drift",
          ],
        },
      );

    assert.deepEqual(
      view.list().map(
        record =>
          record.id,
      ),
      [
        "memory:allowed",
        "memory:independent",
      ],
    );

    assert.deepEqual(
      view.suppressedMemoryIds(),
      [
        "memory:drift",
      ],
    );

    assert.equal(
      source.list().length,
      3,
    );
  },
);


test(
  "memory without canonical governance lineage remains visible under active policy",
  () => {
    const view =
      new GenesisCurrentPolicyOrganizationalMemoryView(
        {
          list:
            () => [
              independent,
            ],
        },
        {
          state:
            "ACTIVE",

          suppressedCanonicalIds:
            [],
        },
      );

    assert.deepEqual(
      view.list().map(
        record =>
          record.id,
      ),
      [
        "memory:independent",
      ],
    );
  },
);


test(
  "fail-closed canonical consumption also fails closed for active memory consumption",
  () => {
    const view =
      new GenesisCurrentPolicyOrganizationalMemoryView(
        {
          list:
            () => [
              allowed,
              drift,
              independent,
            ],
        },
        {
          state:
            "FAIL_CLOSED",

          suppressedCanonicalIds:
            [],
        },
      );

    assert.deepEqual(
      view.list(),
      [],
    );

    assert.deepEqual(
      view.suppressedMemoryIds(),
      [
        "memory:allowed",
        "memory:drift",
        "memory:independent",
      ],
    );
  },
);
