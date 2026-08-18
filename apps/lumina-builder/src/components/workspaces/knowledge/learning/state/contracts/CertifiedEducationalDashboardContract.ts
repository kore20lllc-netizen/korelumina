import {
  educationalArtifacts,
} from "./data/artifacts";

import {
  educationalModules,
} from "./data/modules";

import {
  competencyObjectives,
} from "./data/competencies";

import {
  educationalTimeline,
} from "./data/timeline";

import type {
  CompetencyObjective,
  EducationalArtifact,
  EducationalModule,
  EducationalTimelineEvent,
  EducationalUiState,
} from "../../model";

export interface CertifiedEducationalDashboardContract {
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
}

/*
 * Certified Education data contract.
 *
 * UI is the contract.
 *
 * These values preserve the certified Education composition during
 * initial render and Runtime unavailability. Runtime remains the live
 * source of truth and replaces compatible domains after loading.
 *
 * Fixture code may consume this contract for compatibility/testing.
 * Production code must never consume fixture-owned data.
 */
export const certifiedEducationalDashboardContract:
CertifiedEducationalDashboardContract = {
  state:
    "success",

  artifacts:
    educationalArtifacts,

  modules:
    educationalModules,

  competencies:
    competencyObjectives,

  timeline:
    educationalTimeline,
};
