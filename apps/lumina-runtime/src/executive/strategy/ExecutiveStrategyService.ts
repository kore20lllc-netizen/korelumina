import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveStrategy,
  type CreateExecutiveStrategyInput,
  type ExecutiveStrategy,
  type ExecutiveStrategyStatus,
} from "./ExecutiveStrategy.js";

export class ExecutiveStrategyService {

  private readonly strategies =
    new Map<
      string,
      ExecutiveStrategy
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveStrategyInput,
  ): ExecutiveStrategy {

    const strategy =
      createExecutiveStrategy(
        input,
      );

    this.strategies.set(
      strategy.id,
      strategy,
    );

    this.timeline.record({
      id:
        `${strategy.id}:created`,
      sessionId:
        "executive-strategy",
      type:
        "runtime-event",
      actorId:
        strategy.ownerId,
      source:
        "executive-strategy",
      title:
        strategy.title,
      summary:
        strategy.mission,
      payload: {
        strategyId:
          strategy.id,
      },
    });

    return strategy;
  }

  updateStatus(
    strategyId: string,
    status:
      ExecutiveStrategyStatus,
  ): ExecutiveStrategy {

    const existing =
      this.strategies.get(
        strategyId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive strategy "${strategyId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.strategies.set(
      strategyId,
      updated,
    );

    this.timeline.record({
      id:
        `${strategyId}:${status}`,
      sessionId:
        "executive-strategy",
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-strategy",
      title:
        updated.title,
      summary:
        `Strategy status changed to ${status}.`,
      payload: {
        strategyId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.strategies.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.strategies.values(),
      ),
    );
  }

  clear(): void {
    this.strategies.clear();
  }
}

export function
createExecutiveStrategyService() {
  return new ExecutiveStrategyService();
}
