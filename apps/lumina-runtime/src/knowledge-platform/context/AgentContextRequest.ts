export type AgentRole =
  | "architect"
  | "runtime"
  | "builder"
  | "recovery"
  | "documentation"
  | "reviewer";

export interface AgentContextRequest {
  role: AgentRole;
  objective: string;
  query?: string;
  maxKnowledgeItems?: number;

  organizationId?: string;
  projectIds?: string[];
  teamIds?: string[];
  references?: string[];
}
