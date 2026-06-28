export interface OrganizationalMemoryInput {
  requestId: string;

  organizationId: string;

  projectIds: string[];

  teamIds: string[];

  query: string;

  references: string[];
}
