import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveScenario,
  type CreateExecutiveScenarioInput,
  type ExecutiveScenario,
  type ExecutiveScenarioStatus,
} from "./ExecutiveScenario.js";

export class ExecutiveScenarioService {

  private readonly scenarios =
    new Map<
      string,
      ExecutiveScenario
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveScenarioInput,
  ): ExecutiveScenario {

    const scenario =
      createExecutiveScenario(
        input,
      );

    this.scenarios.set(
      scenario.id,
      scenario,
    );

    this.timeline.record({
      id:
        `${scenario.id}:created`,
      sessionId:
        scenario.sessionId,
      type:
        "runtime-event",
      actorId:
        scenario.ownerId,
      source:
        "executive-scenario",
      title:
        scenario.title,
      summary:
        scenario.description,
      payload: {
        scenarioId:
          scenario.id,
        status:
          scenario.status,
      },
    });

    return scenario;
  }

  updateStatus(
    scenarioId: string,
    status:
      ExecutiveScenarioStatus,
  ): ExecutiveScenario {

    const existing =
      this.scenarios.get(
        scenarioId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive scenario "${scenarioId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.scenarios.set(
      scenarioId,
      updated,
    );

    this.timeline.record({
      id:
        `${scenarioId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-scenario",
      title:
        updated.title,
      summary:
        `Scenario status changed to ${status}.`,
      payload: {
        scenarioId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.scenarios.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.scenarios.values(),
      ),
    );
  }

  clear(): void {
    this.scenarios.clear();
  }
}

export function
createExecutiveScenarioService() {
  return new ExecutiveScenarioService();
}
