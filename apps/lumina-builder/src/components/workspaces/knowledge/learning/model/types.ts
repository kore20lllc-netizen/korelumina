export type EducationalUiState =
  | "empty"
  | "loading"
  | "processing"
  | "success"
  | "partial"
  | "warning"
  | "error"
  | "offline";

export type EducationalArtifactKind =
  | "canon"
  | "constitution"
  | "amendment"
  | "architecture"
  | "reconciliation"
  | "adr"
  | "edr"
  | "specification"
  | "standard"
  | "security"
  | "business"
  | "domain"
  | "api"
  | "user-documentation"
  | "runtime-documentation"
  | "knowledge-operations"
  | "mission"
  | "conversation"
  | "decision"
  | "organizational";

export type EducationalStatus =
  | "completed"
  | "active"
  | "blocked"
  | "not-started"
  | "needs-review";

export interface EducationalArtifact {
  id: string;
  title: string;
  kind: EducationalArtifactKind;
  category: string;
  authorityClass: string;
  approvalState: string;
  owner: string;
  scope: string;
  version: string;
  provenance: string;
  source: string;
  lineage: string[];
  dependencies: string[];
  supersession: string;
  educationalStatus: EducationalStatus;
  educationalImpact: string;
  relatedArtifacts: string[];
  relatedKnowledgePackages: string[];
  relatedCanonicalKnowledge: string[];
  relatedMemory: string[];
  relatedMissions: string[];
  relatedDecisions: string[];
  authors?: string[];
}

export interface EducationalModule {
  id: string;
  title: string;
  description: string;
  status: EducationalStatus;
  completion: number;
  dependencyIds: string[];
  competencyObjectives: string[];
  coverageGap?: string;
  conflict?: string;
}

export interface CompetencyObjective {
  id: string;
  title: string;
  description: string;
  status: EducationalStatus;
  evidence: string;
}

export interface EducationalTimelineEvent {
  id: string;
  date: string;
  label: string;
  type:
    | "recovery"
    | "admission"
    | "approval"
    | "version"
    | "supersession"
    | "completion"
    | "dependency"
    | "competency"
    | "review"
    | "conversation";
  status: EducationalStatus;
  provenance: string;
  artifactIds: string[];
  description: string;
}

export interface EducationalFixtureModel {
  state: EducationalUiState;
  artifacts: EducationalArtifact[];
  modules: EducationalModule[];
  competencies: CompetencyObjective[];
  timeline: EducationalTimelineEvent[];
}

export interface EducationalArtifactFilters {
  query: string;
  authority: string;
  approval: string;
  category: string;
}

export interface EducationalDashboardSelection {
  artifactId: string | null;
  moduleId: string | null;
  timelineType: string;
}
