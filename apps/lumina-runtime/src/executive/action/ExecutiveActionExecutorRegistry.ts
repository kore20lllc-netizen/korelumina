import type {
  ExecutiveActionExecutionOperation,
} from "./ExecutiveActionExecutionOperation.js";

import type {
  ExecutiveActionExecutor,
} from "./ExecutiveActionExecutor.js";

export class ExecutiveActionExecutorRegistry {
  private readonly executors =
    new Map<
      ExecutiveActionExecutionOperation["type"],
      ExecutiveActionExecutor
    >();

  register(
    operationType:
      ExecutiveActionExecutionOperation["type"],

    executor:
      ExecutiveActionExecutor,
  ): void {
    if (
      this.executors.has(
        operationType,
      )
    ) {
      throw new Error(
        "executive_action_executor_operation_already_registered",
      );
    }

    this.executors.set(
      operationType,
      executor,
    );
  }

  resolve(
    operation:
      ExecutiveActionExecutionOperation,
  ): ExecutiveActionExecutor {
    const executor =
      this.executors.get(
        operation.type,
      );

    if (
      !executor
    ) {
      throw new Error(
        "executive_action_executor_operation_not_registered",
      );
    }

    return executor;
  }

  list():
    readonly {
      operationType:
        ExecutiveActionExecutionOperation["type"];

      executorName:
        string;
    }[] {
    return Object.freeze(
      Array.from(
        this.executors.entries(),
      ).map(
        (
          [
            operationType,
            executor,
          ],
        ) =>
          Object.freeze({
            operationType,
            executorName:
              executor.name,
          }),
      ),
    );
  }
}
