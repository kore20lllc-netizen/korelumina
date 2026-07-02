export type EvidenceType =
  | "conversation"
  | "commit"
  | "tag"
  | "branch"
  | "ADR"
  | "RFC"
  | "document"
  | "source-file"
  | "runtime-event"
  | "engineering-execution"
  | "issue"
  | "pull-request"
  | "specification"
  | "roadmap"
  | "milestone"
  | "build-output"
  | "incident-log";

export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  title: string;
  source: string;
  capturedAt: number;
  observedAt: number;
  contentRef: string;
  checksum?: string;
  metadata: Record<string, unknown>;
  relationships: Record<string, string[]>;
}
