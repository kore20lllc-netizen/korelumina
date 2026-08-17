import {
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

/*
 * Knowledge Education is an authoritative read projection.
 *
 * The Runtime GET route does not require caller identity and does not
 * consume authorization headers. Keeping this read dependent on
 * getRuntimeCallerHeaders() allowed an unrelated client-context failure
 * to prevent the request from ever reaching Runtime, after which the
 * Learning state correctly fell back to its neutral certified topology.
 *
 * Keep the certified UI topology independent from caller context.
 */
export async function getEducationalDashboard():
Promise<EducationalDashboardSnapshot> {
  const response =
    await fetch(
      `${RUNTIME_API}/api/knowledge/education`,
      {
        method:
          "GET",

        cache:
          "no-store",
      },
    );

  if (
    !response.ok
  ) {
    throw new Error(
      `failed_to_get_educational_dashboard:${response.status}`,
    );
  }

  return await response.json();
}
