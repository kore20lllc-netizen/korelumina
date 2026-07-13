import {
  RUNTIME_API,
  getRuntimeCallerHeaders,
} from "@/services/runtime/client";

import type {
  RuntimeScenario,
} from "@/services/runtime/types";

export interface RuntimeScenarioResponse {
  ok: boolean;
  projectId: string;
  scenario: RuntimeScenario;
  previousScenario?: RuntimeScenario;
  updatedAt?: number;
}

export async function setRuntimeScenario(
  projectId: string,
  scenario: RuntimeScenario,
): Promise<RuntimeScenarioResponse> {
  const response = await fetch(
    `${RUNTIME_API}/api/runtime/scenario`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getRuntimeCallerHeaders(),
      },
      body: JSON.stringify({
        projectId,
        scenario,
      }),
    },
  );

  const body =
    await response.json();

  if (!response.ok) {
    throw new Error(
      body?.error ??
        "failed_to_set_runtime_scenario",
    );
  }

  return body as RuntimeScenarioResponse;
}
