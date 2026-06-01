export type AuditSeverity = "info" | "warning" | "critical";

export type AuditCategory =
  | "build"
  | "dependency"
  | "import"
  | "asset"
  | "layout"
  | "runtime"
  | "security";

export type AuditStatus =
  | "raw"
  | "audited"
  | "needs_repair"
  | "verified"
  | "certified";

export type AuditFinding = {
  id: string;
  severity: AuditSeverity;
  category: AuditCategory;
  title: string;
  description: string;
  file?: string;
  recommendation: string;
};

export type ProjectFingerprint = {
  framework: string;
  packageManager: "npm" | "pnpm" | "yarn" | "bun" | "unknown";
  hasTypescript: boolean;
  hasTailwind: boolean;
  isWorkspace: boolean;
  hasNodeModules: boolean;
  hasDevScript: boolean;
  hasBuildScript: boolean;
};

export type AuditReport = {
  projectId: string;
  projectPath: string;
  fingerprint: ProjectFingerprint;
  complianceScore: number;
  status: AuditStatus;
  findings: AuditFinding[];
  generatedAt: number;
};
