import type {
  LucideIcon,
} from "lucide-react";

export type ProductionSurfaceState =
  | "empty"
  | "loading"
  | "processing"
  | "success"
  | "partial"
  | "warning"
  | "error"
  | "offline";

export type AuthorityLevel =
  | "constitutional"
  | "architectural"
  | "operational"
  | "supporting";

export type SourceLifecycle =
  | "candidate"
  | "reviewed"
  | "approved"
  | "superseded";

export type CompilerStatus =
  | "queued"
  | "parsing"
  | "extracting"
  | "ir-generation"
  | "validation"
  | "complete"
  | "failed"
  | "retry"
  | "future";

export interface EvidenceSource {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  authority: AuthorityLevel;
  provenance: string;
  owner: string;
  scope: string;
  confidence: number;
  lifecycle: SourceLifecycle;
  educationalContribution: string;
  artifactCount: number;
}

export interface CompilerOperation {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  status: CompilerStatus;
  detailed: boolean;
  queue: number;
  confidence: number;
  educationalContribution: string;
}
