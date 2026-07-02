import type {
  EvidenceType,
} from "../evidence/index.js";

export type KnowledgeIRCandidateType =
  | "CandidateCapability"
  | "CandidateDecision"
  | "CandidatePrinciple"
  | "CandidateLesson"
  | "CandidateIncident"
  | "CandidateRecovery"
  | "CandidateComponent"
  | "CandidateSubsystem"
  | "CandidateMilestone"
  | "CandidateRoadmap"
  | "CandidateExecution"
  | "CandidateArtifact"
  | "CandidateRelationship";

export type KnowledgeIRStatus =
  | "extracted"
  | "normalized"
  | "needs-review"
  | "approved"
  | "rejected"
  | "merged"
  | "superseded";

export interface KnowledgeIRCompilerMetadata {
  compilerName: string;
  compilerVersion: string;
  evidenceSourceType: EvidenceType;
  extractedAt: number;
  extractionMethod: string;
  confidenceBasis: string;
}

export interface KnowledgeIRItem {
  id: string;
  candidateType: KnowledgeIRCandidateType;
  title: string;
  summary: string;
  confidence: number;
  evidenceRefs: string[];
  proposedRelationships: Record<string, string[]>;
  extractedAt: number;
  compiler: KnowledgeIRCompilerMetadata;
  status: KnowledgeIRStatus;
  metadata: Record<string, unknown>;
}
