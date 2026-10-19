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

  /*
   * KA-1 (F-27): "search" (the default) keeps only canonical items whose
   * title or summary shares a word with the query. "all" keeps every
   * current-policy item and leaves ranking to the caller; the Chief Agent
   * uses it because it ranks certified document text itself.
   */
  retrieval?: "search" | "all";

  organizationId?: string;
  projectIds?: string[];
  teamIds?: string[];
  references?: string[];
}
