export type KnowledgeCategory =
  | "architecture"
  | "capability"
  | "engineering-pattern"
  | "production-pattern"
  | "implementation-pattern"
  | "repository-intelligence"
  | "runtime"
  | "deployment"
  | "transformation"
  | "ai"
  | "operational"
  | "lesson-learned"
  | "regression-prevention"
  | "engineering-decision";

export interface KnowledgeDocument {
  id: string;
  source: string;
  type: string;
  path: string;
  content: string;
  metadata: Record<string, unknown>;
}

export interface KnowledgeRecord {
  id: string;
  category: KnowledgeCategory;
  title: string;
  summary: string;
  source: string;
  tags: string[];
  relationships: string[];
  metadata: Record<string, unknown>;
}
