export interface OrganizationalMemoryInsight {
  id: string;

  organizationId: string;

  title: string;

  summary: string;

  recordIds: string[];

  confidence: number;
}
