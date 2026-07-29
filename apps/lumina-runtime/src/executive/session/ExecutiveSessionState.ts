export type ExecutiveSessionState =
  | "created"
  | "active"
  | "briefing"
  | "review"
  | "decision-pending"
  | "approved"
  | "executing"
  | "observing"
  | "reflecting"
  | "completed"
  | "archived";

export const EXECUTIVE_SESSION_STATES: readonly ExecutiveSessionState[] = [
  "created",
  "active",
  "briefing",
  "review",
  "decision-pending",
  "approved",
  "executing",
  "observing",
  "reflecting",
  "completed",
  "archived",
];

const TRANSITIONS = new Map<
  ExecutiveSessionState,
  readonly ExecutiveSessionState[]
>([
  ["created", ["active", "archived"]],
  ["active", ["briefing", "review", "decision-pending", "archived"]],
  ["briefing", ["active", "review", "decision-pending", "archived"]],
  ["review", ["active", "briefing", "decision-pending", "archived"]],
  ["decision-pending", ["active", "review", "approved", "archived"]],
  ["approved", ["executing", "completed", "archived"]],
  ["executing", ["observing", "reflecting", "completed", "archived"]],
  ["observing", ["executing", "reflecting", "completed", "archived"]],
  ["reflecting", ["active", "completed", "archived"]],
  ["completed", ["reflecting", "archived"]],
  ["archived", []],
]);

export function isExecutiveSessionState(
  value: unknown,
): value is ExecutiveSessionState {
  return (
    typeof value === "string" &&
    EXECUTIVE_SESSION_STATES.includes(
      value as ExecutiveSessionState,
    )
  );
}

export function getAllowedExecutiveSessionTransitions(
  state: ExecutiveSessionState,
): readonly ExecutiveSessionState[] {
  return TRANSITIONS.get(state) ?? [];
}

export function canTransitionExecutiveSessionState(
  currentState: ExecutiveSessionState,
  nextState: ExecutiveSessionState,
): boolean {
  if (currentState === nextState) {
    return false;
  }

  return getAllowedExecutiveSessionTransitions(
    currentState,
  ).includes(nextState);
}

export function assertExecutiveSessionTransition(
  currentState: ExecutiveSessionState,
  nextState: ExecutiveSessionState,
): void {
  if (
    canTransitionExecutiveSessionState(
      currentState,
      nextState,
    )
  ) {
    return;
  }

  throw new Error(
    `Illegal executive session transition from "${currentState}" to "${nextState}".`,
  );
}

export function isTerminalExecutiveSessionState(
  state: ExecutiveSessionState,
): boolean {
  return state === "archived";
}
