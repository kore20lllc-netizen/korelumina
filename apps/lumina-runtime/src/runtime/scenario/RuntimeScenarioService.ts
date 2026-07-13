export type RuntimeScenario =
  | "normal"
  | "idle"
  | "spike"
  | "recover"
  | "outage";

interface RuntimeScenarioState {
  scenario: RuntimeScenario;
  updatedAt: number;
}

const scenarioMap = new Map<
  string,
  RuntimeScenarioState
>();

export function setRuntimeScenario(
  projectId: string,
  scenario: RuntimeScenario,
): RuntimeScenarioState {
  const state: RuntimeScenarioState = {
    scenario,
    updatedAt: Date.now(),
  };

  scenarioMap.set(
    projectId,
    state,
  );

  return state;
}

export function getRuntimeScenario(
  projectId: string,
): RuntimeScenario {
  return (
    scenarioMap.get(
      projectId,
    )?.scenario ?? "normal"
  );
}

export function getRuntimeScenarioState(
  projectId: string,
): RuntimeScenarioState | null {
  return (
    scenarioMap.get(
      projectId,
    ) ?? null
  );
}

export function listRuntimeScenarios() {
  return Array.from(
    scenarioMap.entries(),
  ).map(
    ([
      projectId,
      state,
    ]) => ({
      projectId,
      ...state,
    }),
  );
}

export function clearRuntimeScenario(
  projectId: string,
): void {
  scenarioMap.delete(
    projectId,
  );
}

export function clearRuntimeScenarios(): void {
  scenarioMap.clear();
}
