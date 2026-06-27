export type DecisionRelationType =
  | "supersedes"
  | "dependsOn"
  | "affects"
  | "references"
  | "approvedBy";

export interface DecisionRelation {
  id: string;

  fromDecisionId: string;

  toId: string;

  type: DecisionRelationType;

  createdAt: number;
}
