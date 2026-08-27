import {
  buildInitialCompetencyAssessmentCandidate,
} from "./InitialCompetencyAssessmentCandidate.js";

import type {
  InitialCompetencyAssessmentCandidate,
} from "./InitialCompetencyAssessmentCandidate.js";

import type {
  EducationalCorpusCertificationRuntimeProjection,
} from "./EducationalCorpusCertificationService.js";

import type {
  KnowledgeEducationSnapshot,
} from "./KnowledgeEducationProjectionService.js";


export interface InitialCompetencyEducationReader {
  snapshot():
    KnowledgeEducationSnapshot;
}


export interface InitialCompetencyCorpusCertificationReader {
  read():
    EducationalCorpusCertificationRuntimeProjection;
}


export class InitialCompetencyAssessmentService {
  constructor(
    private readonly education:
      InitialCompetencyEducationReader,

    private readonly corpusCertification:
      InitialCompetencyCorpusCertificationReader,
  ) {}


  read():
    InitialCompetencyAssessmentCandidate {
    return buildInitialCompetencyAssessmentCandidate({
      education:
        this.education
          .snapshot(),

      corpusCertification:
        this.corpusCertification
          .read(),
    });
  }
}
