export type KnowledgeV3Domain =
  | "learning"
  | "production";

export interface KnowledgeV3DomainDefinition {
  id: KnowledgeV3Domain;
  label: string;
  description: string;
}
