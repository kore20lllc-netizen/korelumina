export interface EngineerAgentAction {
  id: string;

  title: string;

  description: string;

  rationale: string;

  planId: string;

  stepId: string;

  actionType:
    | "analysis"
    | "implementation"
    | "validation"
    | "documentation"
    | "review";

  status:
    | "proposed"
    | "approved"
    | "rejected"
    | "completed";
}
