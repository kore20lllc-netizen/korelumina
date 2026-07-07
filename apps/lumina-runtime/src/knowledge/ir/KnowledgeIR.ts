import type {
  EvidenceItem,
} from "./EvidenceItem.js";

import type {
  KnowledgeScope,
} from "./KnowledgeScope.js";

export type KnowledgeIRKind =
  | "fact"
  | "decision"
  | "pattern"
  | "constraint"
  | "capability"
  | "risk"
  | "lesson"
  | "relationship"
  | "procedure";

export type KnowledgeIRStatus =
  | "candidate"
  | "validated"
  | "rejected"
  | "promoted";

export interface KnowledgeIRRelation {
  type: string;
  targetId: string;
  evidenceIds: string[];
}

export interface KnowledgeIR<T = unknown> {
  id: string;
  kind: KnowledgeIRKind;
  title: string;
  summary: string;
  scope: KnowledgeScope;
  status: KnowledgeIRStatus;
  confidence: number;
  evidence: EvidenceItem[];
  relations?: KnowledgeIRRelation[];
  data: T;
  createdAt: number;
  updatedAt: number;
  compiler: {
    id: string;
    version: string;
    sourceType: string;
  };
}
