import {
  certifiedEducationalDashboardContract,
} from "../state/contracts/CertifiedEducationalDashboardContract";

import {
  educationalArtifacts,
} from "../state/contracts/data/artifacts";

import {
  educationalModules,
} from "../state/contracts/data/modules";

import {
  competencyObjectives,
} from "../state/contracts/data/competencies";

import {
  educationalTimeline,
} from "../state/contracts/data/timeline";

import type {
  EducationalFixtureModel,
} from "../model";

export {
  competencyObjectives,
  educationalArtifacts,
  educationalModules,
  educationalTimeline,
};

export const educationalFixture:
EducationalFixtureModel = {
  state:
    certifiedEducationalDashboardContract.state,

  artifacts:
    certifiedEducationalDashboardContract.artifacts,

  modules:
    certifiedEducationalDashboardContract.modules,

  competencies:
    certifiedEducationalDashboardContract.competencies,

  timeline:
    certifiedEducationalDashboardContract.timeline,
};
