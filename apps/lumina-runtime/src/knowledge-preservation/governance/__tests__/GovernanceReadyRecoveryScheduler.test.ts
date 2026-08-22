import assert from "node:assert/strict";
import test from "node:test";

import type {
  GovernanceReadyRecoverySweepResult,
} from "../GovernanceReadyRecoverySweep.js";

import {
  DEFAULT_GOVERNANCE_RECOVERY_INTERVAL_MS,
  GovernanceReadyRecoveryScheduler,
} from "../GovernanceReadyRecoveryScheduler.js";

function result(
  executedAt =
    1000,
):
  GovernanceReadyRecoverySweepResult {
  return {
    executedAt,

    scanned:
      0,

    recoverable:
      0,

    recovered:
      0,

    ignored:
      0,

    exceptions:
      0,

    packages:
      [],
  };
}

test(
  "default scheduling policy is five minutes with immediate recovery enabled",
  () => {
    let calls =
      0;

    const scheduler =
      new GovernanceReadyRecoveryScheduler(
        {
          execute() {
            calls +=
              1;

            return result();
          },
        },
      );

    scheduler.start();

    try {
      assert.equal(
        calls,
        1,
      );

      const status =
        scheduler.status();

      assert.equal(
        status.running,
        true,
      );

      assert.equal(
        status.intervalMs,
        DEFAULT_GOVERNANCE_RECOVERY_INTERVAL_MS,
      );

      assert.equal(
        status.intervalMs,
        300000,
      );

      assert.equal(
        status.executionCount,
        1,
      );
    } finally {
      scheduler.stop();
    }
  },
);

test(
  "start is idempotent and does not duplicate immediate recovery",
  () => {
    let calls =
      0;

    const scheduler =
      new GovernanceReadyRecoveryScheduler(
        {
          execute() {
            calls +=
              1;

            return result();
          },
        },
        {
          intervalMs:
            60000,
        },
      );

    scheduler.start();
    scheduler.start();

    try {
      assert.equal(
        calls,
        1,
      );

      assert.equal(
        scheduler.status()
          .running,
        true,
      );
    } finally {
      scheduler.stop();
    }
  },
);

test(
  "stop is idempotent and clears scheduler ownership",
  () => {
    const scheduler =
      new GovernanceReadyRecoveryScheduler(
        {
          execute() {
            return result();
          },
        },
        {
          runImmediately:
            false,

          intervalMs:
            60000,
        },
      );

    scheduler.start();

    assert.equal(
      scheduler.status()
        .running,
      true,
    );

    scheduler.stop();
    scheduler.stop();

    assert.equal(
      scheduler.status()
        .running,
      false,
    );
  },
);

test(
  "runOnce records successful recovery result",
  () => {
    let now =
      1000;

    const expected =
      result(
        1100,
      );

    const scheduler =
      new GovernanceReadyRecoveryScheduler(
        {
          execute() {
            return expected;
          },
        },
        {
          runImmediately:
            false,
        },
        () => {
          now +=
            100;

          return now;
        },
      );

    const actual =
      scheduler.runOnce();

    assert.equal(
      actual,
      expected,
    );

    const status =
      scheduler.status();

    assert.equal(
      status.executionCount,
      1,
    );

    assert.equal(
      status.lastResult,
      expected,
    );

    assert.equal(
      status.lastError,
      null,
    );

    assert.equal(
      status.lastStartedAt,
      1100,
    );

    assert.equal(
      status.lastCompletedAt,
      1200,
    );
  },
);

test(
  "sweep failure is isolated and does not escape Runtime scheduler boundary",
  () => {
    const errors:
      unknown[] =
        [];

    const scheduler =
      new GovernanceReadyRecoveryScheduler(
        {
          execute() {
            throw new Error(
              "simulated_recovery_failure",
            );
          },
        },
        {
          runImmediately:
            false,

          onError(
            error,
          ) {
            errors.push(
              error,
            );
          },
        },
      );

    assert.doesNotThrow(
      () => {
        const result =
          scheduler.runOnce();

        assert.equal(
          result,
          null,
        );
      },
    );

    const status =
      scheduler.status();

    assert.equal(
      status.executionCount,
      1,
    );

    assert.equal(
      status.lastError,
      "simulated_recovery_failure",
    );

    assert.equal(
      errors.length,
      1,
    );
  },
);

test(
  "result observer receives aggregate recovery outcome",
  () => {
    const observed:
      GovernanceReadyRecoverySweepResult[] =
        [];

    const expected =
      {
        ...result(
          2000,
        ),

        scanned:
          4,

        recoverable:
          2,

        recovered:
          1,

        ignored:
          1,

        exceptions:
          2,
      };

    const scheduler =
      new GovernanceReadyRecoveryScheduler(
        {
          execute() {
            return expected;
          },
        },
        {
          runImmediately:
            false,

          onResult(
            value,
          ) {
            observed.push(
              value,
            );
          },
        },
      );

    scheduler.runOnce();

    assert.deepEqual(
      observed,
      [
        expected,
      ],
    );
  },
);

test(
  "invalid interval fails closed",
  () => {
    assert.throws(
      () =>
        new GovernanceReadyRecoveryScheduler(
          {
            execute() {
              return result();
            },
          },
          {
            intervalMs:
              0,
          },
        ),
      /governance_recovery_scheduler_interval_invalid/,
    );

    assert.throws(
      () =>
        new GovernanceReadyRecoveryScheduler(
          {
            execute() {
              return result();
            },
          },
          {
            intervalMs:
              Number.NaN,
          },
        ),
      /governance_recovery_scheduler_interval_invalid/,
    );
  },
);
