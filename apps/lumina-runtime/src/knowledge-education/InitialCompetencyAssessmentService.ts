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
  InitialCompetencyEvidenceRecord,
} from "./InitialCompetencyEvidenceContract.js";

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


export interface InitialCompetencyEvidenceReader {
  list():
    readonly InitialCompetencyEvidenceRecord[];
}


export class InitialCompetencyAssessmentService {
  constructor(
    private readonly education:
      InitialCompetencyEducationReader,

    private readonly corpusCertification:
      InitialCompetencyCorpusCertificationReader,

    private readonly evidence?:
      InitialCompetencyEvidenceReader,
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

      evidence:
        this.evidence
          ?.list() ??
        [],
    });
  }
}
