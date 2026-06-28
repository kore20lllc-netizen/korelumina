export interface ReasoningFinding {
  id: string;
  title: string;
  description: string;
  evidence: string[];
  severity: "low" | "medium" | "high" | "critical";
}
