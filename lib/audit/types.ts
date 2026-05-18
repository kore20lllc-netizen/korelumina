export type Severity = "low" | "medium" | "high" | "critical";

export interface AuditReport {
  projectId: string;
  generatedAt: string;
  buildStatus: "passing" | "warning" | "failing";
  typeErrors: number;
  estimatedFixMinutes: number;
  missingDependencies: Array<{ name: string; required: string; found: string | null; severity: Severity }>;
  buildErrors: Array<{ file: string; line: number; message: string; code?: string }>;
  envVars: Array<{ key: string; description: string; present: boolean; required: boolean }>;
  securityFindings: Array<{ id: string; package: string; severity: Severity; title: string; fixedIn?: string }>;
  repairPlan: Array<{ id: string; title: string; detail: string; estMinutes: number; automated: boolean }>;
}
