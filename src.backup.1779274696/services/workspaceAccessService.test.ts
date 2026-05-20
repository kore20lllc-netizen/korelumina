import { describe, it, expect } from "vitest";
import { getCapabilities, type WorkspaceRole } from "./workspaceAccessService";

describe("workspaceAccessService — repoAudit gating", () => {
  const hidden: WorkspaceRole[] = ["user", "pro", "business"];
  const visible: WorkspaceRole[] = ["enterprise", "inhouse-dev"];

  it.each(hidden)("hides Repo Audit for %s", (role) => {
    expect(getCapabilities(role).repoAudit).toBe(false);
  });

  it.each(visible)("shows Repo Audit for %s", (role) => {
    expect(getCapabilities(role).repoAudit).toBe(true);
  });

  it("specifically hides Repo Audit for Business", () => {
    expect(getCapabilities("business").repoAudit).toBe(false);
  });
});