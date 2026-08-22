export interface GovernanceReadySignal {
  packageId:
    string;

  packageVersion:
    string;

  manufacturingRunId:
    string;

  evidenceId:
    string;

  emittedAt:
    number;
}

export interface GovernanceReadySignalPublisher {
  publish(
    signal:
      GovernanceReadySignal,
  ): void;
}

export class NoopGovernanceReadySignalPublisher
implements GovernanceReadySignalPublisher {
  publish(
    _signal:
      GovernanceReadySignal,
  ): void {
    /*
     * Phase 51 establishes the manufacturing signal contract
     * only. Runtime trigger composition is intentionally
     * introduced in a later governed milestone.
     */
  }
}
