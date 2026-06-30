const MAX_AUTO_RESTARTS = 3;

const AUTO_RESTART_WINDOW_MS = 60_000;

type RestartState = {
  count: number;
  windowStartedAt: number;
};

type RestartHistory = {
  projectId: string;
  count: number;
  windowStartedAt: number;
  lastRestartAt: number;
  lastRecoveredAt?: number;
  lastFailureReason?: string;
};

export const AUTO_RESTART_DELAY_MS = 1_500;

const restartHistory =
  new Map<
    string,
    RestartHistory
  >();

const restartState =
  new Map<
    string,
    RestartState
  >();

export function shouldAutoRestart(
  projectId: string,
): boolean {
  const now = Date.now();

  const current =
    restartState.get(projectId);

  if (
    !current ||
    now -
      current.windowStartedAt >
      AUTO_RESTART_WINDOW_MS
  ) {
    restartState.set(
      projectId,
      {
        count: 1,
        windowStartedAt: now,
      },
    );

    restartHistory.set(
      projectId,
      {
        projectId,
        count: 1,
        windowStartedAt: now,
        lastRestartAt: now,
      },
    );

    return true;
  }

  if (
    current.count >=
    MAX_AUTO_RESTARTS
  ) {
    return false;
  }

  current.count += 1;

  const history =
    restartHistory.get(projectId);

  if (history) {
    history.count += 1;
    history.lastRestartAt = now;
  }

  return true;
}

export function clearRestartState(
  projectId: string,
) {
  restartState.delete(projectId);
}

export function recordRestartHistory(
  projectId: string,
  reason: "manual" | "auto-recovery",
) {
  const now = Date.now();

  const existing =
    restartHistory.get(projectId);

  restartHistory.set(
    projectId,
    {
      projectId,
      count:
        (existing?.count ?? 0) + 1,
      windowStartedAt:
        existing?.windowStartedAt ??
        now,
      lastRestartAt: now,
      lastRecoveredAt:
        existing?.lastRecoveredAt,
      lastFailureReason: reason,
    },
  );
}

export function getRestartState(
  projectId: string,
) {
  const state =
    restartState.get(projectId);

  if (!state) {
    return null;
  }

  return {
    projectId,
    ...state,
  };
}

export function getAllRestartStates() {
  return Array.from(
    restartHistory.values(),
  );
}

export function getRestartHistory(
  projectId: string,
) {
  return restartHistory.get(projectId);
}
