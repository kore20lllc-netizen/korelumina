export interface OrganizationalMemoryGovernance {
  canonicalItemId: string;

  packageId?: string;

  packageVersion?: string;

  authority?: string;

  owner?: string;

  scope?: string;

  approval?: {
    decision:
      "approved";

    reviewerId:
      string;

    reviewedAt:
      number;

    reason?:
      unknown;
  };

  provenanceRefs:
    string[];

  lineage:
    string[];

  dependencies:
    string[];

  supersedes:
    string[];

  trust: {
    canonical:
      true;

    humanApproved:
      boolean;

    adaptationValidated:
      boolean;
  };

  privacy: {
    generalized:
      boolean;

    customerSpecificContentRetained:
      false;
  };
}

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

  governance?:
    OrganizationalMemoryGovernance;

  createdAt: string;
}
