import assert from "node:assert/strict";
import test from "node:test";

import type {
  GovernanceReadySignal,
  GovernanceReadySignalPublisher,
} from "../GovernanceReadySignal.js";

import {
  DelegatingGovernanceReadySignalPublisher,
} from "../GovernanceReadySignal.js";

function signal():
  GovernanceReadySignal {
  return {
    packageId:
      "KP-PHASE53",

    packageVersion:
      "1.0.0",

    manufacturingRunId:
      "KMR-PHASE53",

    evidenceId:
      "EVIDENCE-PHASE53",

    emittedAt:
      5000,
  };
}

test(
  "delegating publisher is inert before Runtime consumer is wired",
  () => {
    const publisher =
      new DelegatingGovernanceReadySignalPublisher();

    assert.doesNotThrow(
      () =>
        publisher.publish(
          signal(),
        ),
    );
  },
);

test(
  "delegating publisher forwards exact signal after consumer wiring",
  () => {
    const publisher =
      new DelegatingGovernanceReadySignalPublisher();

    const received:
      GovernanceReadySignal[] =
        [];

    const delegate:
      GovernanceReadySignalPublisher = {
        publish(
          value,
        ) {
          received.push(
            value,
          );
        },
      };

    publisher.setDelegate(
      delegate,
    );

    const expected =
      signal();

    publisher.publish(
      expected,
    );

    assert.deepEqual(
      received,
      [
        expected,
      ],
    );
  },
);

test(
  "delegate may be cleared without affecting manufacturing caller",
  () => {
    const publisher =
      new DelegatingGovernanceReadySignalPublisher();

    let calls =
      0;

    publisher.setDelegate({
      publish() {
        calls +=
          1;
      },
    });

    publisher.publish(
      signal(),
    );

    assert.equal(
      calls,
      1,
    );

    publisher.clearDelegate();

    assert.doesNotThrow(
      () =>
        publisher.publish(
          signal(),
        ),
    );

    assert.equal(
      calls,
      1,
    );
  },
);

test(
  "replacing delegate routes future signals only to current Runtime consumer",
  () => {
    const publisher =
      new DelegatingGovernanceReadySignalPublisher();

    let first =
      0;

    let second =
      0;

    publisher.setDelegate({
      publish() {
        first +=
          1;
      },
    });

    publisher.publish(
      signal(),
    );

    publisher.setDelegate({
      publish() {
        second +=
          1;
      },
    });

    publisher.publish(
      signal(),
    );

    assert.equal(
      first,
      1,
    );

    assert.equal(
      second,
      1,
    );
  },
);
