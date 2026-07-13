export type SourceReferenceType =
  | "document"
  | "git"
  | "conversation"
  | "runtime"
  | "issue"
  | "pull-request"
  | "deployment"
  | "repository"
  | "architecture"
  | "engineering";

export interface SourceReference {
  type: SourceReferenceType;
  id: string;
  uri?: string;
  path?: string;
  commit?: string;
  lineStart?: number;
  lineEnd?: number;
  timestamp?: number;
}
