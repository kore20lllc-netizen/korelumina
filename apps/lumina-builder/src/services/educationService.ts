import {
  getRuntimeCallerHeaders,
  RUNTIME_API,
} from "@/services/runtime/client";

import type {
  CompetencyObjective,
  EducationalArtifact,
  EducationalModule,
  EducationalTimelineEvent,
  EducationalUiState,
} from "@/components/workspaces/knowledge/learning/model";

export interface EducationalDashboardSnapshot {
  state:
    EducationalUiState;

  artifacts:
    EducationalArtifact[];

  modules:
    EducationalModule[];

  competencies:
    CompetencyObjective[];

  timeline:
    EducationalTimelineEvent[];

  generatedAt:
    number;

  source:
    "canonical-knowledge";
}

export async function getEducationalDashboard():
Promise<EducationalDashboardSnapshot> {
  const response =
    await fetch(
      `${RUNTIME_API}/api/knowledge/education`,
      {
        headers:
          getRuntimeCallerHeaders(),
      },
    );

  if (
    !response.ok
  ) {
    throw new Error(
      "failed_to_get_educational_dashboard",
    );
  }

  return await response.json();
}
