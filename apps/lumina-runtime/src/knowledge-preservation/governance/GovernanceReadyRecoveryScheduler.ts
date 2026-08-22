import type {
  GovernanceReadyRecoverySweepResult,
} from "./GovernanceReadyRecoverySweep.js";

export interface GovernanceReadyRecoverySweepPort {
  execute():
    GovernanceReadyRecoverySweepResult;
}

export interface GovernanceReadyRecoverySchedulerOptions {
  intervalMs?:
    number;

  runImmediately?:
    boolean;

  onResult?:
    (
      result:
        GovernanceReadyRecoverySweepResult,
    ) => void;

  onError?:
    (
      error:
        unknown,
    ) => void;
}

export interface GovernanceReadyRecoverySchedulerStatus {
  running:
    boolean;

  intervalMs:
    number;

  executionCount:
    number;

  lastStartedAt:
    number | null;

  lastCompletedAt:
    number | null;

  lastResult:
    GovernanceReadyRecoverySweepResult |
    null;

  lastError:
    string | null;
}

export const DEFAULT_GOVERNANCE_RECOVERY_INTERVAL_MS =
  5 * 60 * 1000;

function normalizeInterval(
  value:
    number |
    undefined,
): number {
  if (
    value ===
      undefined
  ) {
    return DEFAULT_GOVERNANCE_RECOVERY_INTERVAL_MS;
  }

  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new Error(
      "governance_recovery_scheduler_interval_invalid",
    );
  }

  return Math.floor(
    value,
  );
}

export class GovernanceReadyRecoveryScheduler {
  private timer:
    ReturnType<
      typeof setInterval
    > |
    null =
      null;

  private executing =
    false;

  private executionCount =
    0;

  private lastStartedAt:
    number |
    null =
      null;

  private lastCompletedAt:
    number |
    null =
      null;

  private lastResult:
    GovernanceReadyRecoverySweepResult |
    null =
      null;

  private lastError:
    string |
    null =
      null;

  private readonly intervalMs:
    number;

  private readonly runImmediately:
    boolean;

  private readonly onResult:
    (
      result:
        GovernanceReadyRecoverySweepResult,
    ) => void;

  private readonly onError:
    (
      error:
        unknown,
    ) => void;

  constructor(
    private readonly sweep:
      GovernanceReadyRecoverySweepPort,

    options:
      GovernanceReadyRecoverySchedulerOptions =
        {},

    private readonly now:
      () => number =
        () => Date.now(),
  ) {
    this.intervalMs =
      normalizeInterval(
        options.intervalMs,
      );

    this.runImmediately =
      options.runImmediately ??
      true;

    this.onResult =
      options.onResult ??
      (() => {});

    this.onError =
      options.onError ??
      (() => {});
  }

  start(): void {
    if (
      this.timer !==
        null
    ) {
      return;
    }

    if (
      this.runImmediately
    ) {
      this.runOnce();
    }

    this.timer =
      setInterval(
        () => {
          this.runOnce();
        },
        this.intervalMs,
      );

    this.timer.unref?.();
  }

  stop(): void {
    if (
      this.timer ===
        null
    ) {
      return;
    }

    clearInterval(
      this.timer,
    );

    this.timer =
      null;
  }

  runOnce():
    GovernanceReadyRecoverySweepResult |
    null {
    /*
     * Recovery is deliberately non-overlapping.
     *
     * Event-driven governance remains primary. The sweep is a
     * low-frequency safety mechanism and should never stack
     * concurrent recovery executions under Runtime pressure.
     */
    if (
      this.executing
    ) {
      return null;
    }

    this.executing =
      true;

    this.lastStartedAt =
      this.now();

    try {
      const result =
        this.sweep.execute();

      this.executionCount +=
        1;

      this.lastResult =
        result;

      this.lastError =
        null;

      this.lastCompletedAt =
        this.now();

      this.onResult(
        result,
      );

      return result;
    } catch (
      error
    ) {
      this.executionCount +=
        1;

      this.lastError =
        error instanceof Error
          ? error.message
          : String(
              error,
            );

      this.lastCompletedAt =
        this.now();

      this.onError(
        error,
      );

      return null;
    } finally {
      this.executing =
        false;
    }
  }

  status():
    GovernanceReadyRecoverySchedulerStatus {
    return {
      running:
        this.timer !==
        null,

      intervalMs:
        this.intervalMs,

      executionCount:
        this.executionCount,

      lastStartedAt:
        this.lastStartedAt,

      lastCompletedAt:
        this.lastCompletedAt,

      lastResult:
        this.lastResult,

      lastError:
        this.lastError,
    };
  }
}
