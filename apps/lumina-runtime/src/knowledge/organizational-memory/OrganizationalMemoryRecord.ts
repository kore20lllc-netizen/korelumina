export interface OrganizationalMemoryRecord {
  id: string;

  organizationId: string;

  projectId?: string;

  teamId?: string;

  title: string;

  summary: string;

  source:
    | "architecture"
    | "reconciliation"
    | "execution"
    | "incident"
    | "audit"
    | "manual";

  references: string[];

  createdAt: string;
}
