import type {
  KnowledgeIRCandidateType,
} from "../knowledge-preservation/ir/index.js";

export type CanonicalKnowledgeStatus =
  | "canonical"
  | "superseded"
  | "archived";

export interface CanonicalKnowledgeItem {
  id: string;
  type: KnowledgeIRCandidateType;
  title: string;
  summary: string;
  confidence: number;
  evidenceRefs: string[];
  relationships: Record<string, string[]>;
  createdAt: number;
  updatedAt: number;
  status: CanonicalKnowledgeStatus;
  metadata: Record<string, unknown>;
}
