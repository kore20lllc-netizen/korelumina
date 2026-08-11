import type {
  KnowledgeIRItem,
} from "../ir/index.js";

export type KnowledgePackageLifecycleState =
  | "captured"
  | "compiled"
  | "validated"
  | "awaiting_review"
  | "approved"
  | "canonical"
  | "adapted"
  | "consumed"
  | "superseded"
  | "archived";

export interface KnowledgePackage {
  id: string;

  state:
    KnowledgePackageLifecycleState;

  sourceEvidenceRefs:
    string[];

  knowledgeItemIds:
    string[];

  items:
    KnowledgeIRItem[];

  createdAt:
    number;

  updatedAt:
    number;

  metadata:
    Record<string, unknown>;
}
