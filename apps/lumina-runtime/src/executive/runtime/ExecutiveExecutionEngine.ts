import type {
  ExecutiveExecutionDecision,
} from "./ExecutiveDecisionEngine.js";

export type ExecutiveRuntimeExecutionStatus =
  | "pending"
  | "scheduled"
  | "executing"
  | "completed"
  | "deferred";

export interface ExecutiveRuntimeExecutionRecord {

  readonly id: string;

  readonly recommendationId: string;

  readonly action: string;

  readonly status:
    ExecutiveRuntimeExecutionStatus;

  readonly createdAt: number;

  readonly metadata:
    Readonly<Record<string, unknown>>;
}

export class ExecutiveExecutionEngine {

  execute(
    decisions:
      readonly ExecutiveExecutionDecision[],
  ): readonly ExecutiveRuntimeExecutionRecord[] {

    const now = Date.now();

    return Object.freeze(

      decisions.map(
        (
          decision,
          index,
        ) => {

          const status:
            ExecutiveRuntimeExecutionStatus =
            decision.action === "execute"
              ? "pending"
              : decision.action === "schedule"
              ? "scheduled"
              : decision.action === "monitor"
              ? "pending"
              : "deferred";

          return Object.freeze({

            id:
              `exec-${now}-${index}`,

            recommendationId:
              decision.recommendationId,

            action:
              decision.action,

            status,

            createdAt:
              now,

            metadata:
              Object.freeze({

                priority:
                  decision.priority,

                reason:
                  decision.reason,
              }),
          });
        },
      ),
    );
  }
}

export function
createExecutiveExecutionEngine() {

  return new ExecutiveExecutionEngine();
}
