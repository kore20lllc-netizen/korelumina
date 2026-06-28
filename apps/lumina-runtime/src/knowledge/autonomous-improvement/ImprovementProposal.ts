export interface ImprovementProposal {
  id: string;

  title: string;

  summary: string;

  rationale: string;

  priority:
    | "low"
    | "medium"
    | "high"
    | "critical";

  affectedSystems: string[];

  references: string[];
}
