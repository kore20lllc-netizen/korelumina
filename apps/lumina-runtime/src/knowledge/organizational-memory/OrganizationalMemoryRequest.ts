export interface OrganizationalMemoryRequest {
  requestId: string;

  organizationId: string;

  projectId?: string;

  teamId?: string;

  objective: string;

  createdAt: string;
}
