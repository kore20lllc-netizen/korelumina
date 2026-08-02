import {
  competencyObjectives,
} from "./competencies";

import {
  educationalArtifacts,
} from "./artifacts";

import {
  educationalModules,
} from "./modules";

import {
  educationalTimeline,
} from "./timeline";

import type {
  EducationalFixtureModel,
} from "../model";

export {
  competencyObjectives,
  educationalArtifacts,
  educationalModules,
  educationalTimeline,
};

export const educationalFixture: EducationalFixtureModel = {
  state: "success",
  artifacts:
    educationalArtifacts,
  modules:
    educationalModules,
  competencies:
    competencyObjectives,
  timeline:
    educationalTimeline,
};
