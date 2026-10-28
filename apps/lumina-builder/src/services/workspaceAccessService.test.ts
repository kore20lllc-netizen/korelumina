import { describe, it, expect } from "vitest";
import { getCapabilities, type WorkspaceRole } from "./workspaceAccessService";
import { repoAuditAccess, type RepoAuditAccess } from "./repoAuditAccess";

// ADR-0046: workspace access comes from repoAuditAccess(), not the raw
// repoAudit capability alone. Customers diagnose; staff also repair.
const accessByRole: [WorkspaceRole, boolean, RepoAuditAccess][] = [
  ["user", false, null],
  ["pro", false, null],
  ["business", false, "diagnosis"],
  ["enterprise", false, "diagnosis"],
  ["inhouse-dev", true, "engineer"],
  ["admin", false, "engineer"],
  ["super_admin", true, "engineer"],
];

describe("Repo Audit access — ADR-0046", () => {
  it.each(accessByRole)(
    "preserves the capability and workspace access policy for %s",
    (role, capability, access) => {
      expect(getCapabilities(role).repoAudit).toBe(capability);
      expect(repoAuditAccess(role)).toBe(access);
    },
  );
});
