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


export class DelegatingGovernanceReadySignalPublisher
implements GovernanceReadySignalPublisher {
  private delegate:
    GovernanceReadySignalPublisher |
    null =
      null;

  setDelegate(
    delegate:
      GovernanceReadySignalPublisher,
  ): void {
    this.delegate =
      delegate;
  }

  clearDelegate(): void {
    this.delegate =
      null;
  }

  publish(
    signal:
      GovernanceReadySignal,
  ): void {
    /*
     * Runtime composition may establish the preservation
     * platform before the governance consumer is available.
     *
     * Until a delegate is installed, manufacturing remains
     * inert at the governance boundary.
     */
    this.delegate
      ?.publish(
        signal,
      );
  }
}
