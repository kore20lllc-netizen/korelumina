import type {
  KnowledgeScope,
} from "./KnowledgeScope.js";

import type {
  SourceReference,
} from "./SourceReference.js";

export type EvidenceKind =
  | "architecture-decision"
  | "specification"
  | "implementation"
  | "conversation"
  | "runtime-event"
  | "build-result"
  | "git-history"
  | "repository-state"
  | "issue"
  | "pull-request"
  | "deployment"
  | "operational-note";

export interface EvidenceItem<T = unknown> {
  id: string;
  kind: EvidenceKind;
  source: SourceReference;
  scope: KnowledgeScope;
  capturedAt: number;
  immutable: true;
  content: T;
  metadata?: Record<string, unknown>;
}
