import { describe, it, expect, beforeEach } from "vitest";
import { clearNamespace } from "@/lib/persistence";
import { MockTeamProvider } from "@/providers/team/MockTeamProvider";
import { can } from "@/services/teamPermissions";
import { team as teamProvider } from "@/providers/team-registry";
import { checkWorkspaceLimit, getWorkspaceLimits } from "@/services/workspaceEntitlements";
import { projectRepository } from "@/services/projectRepository";

beforeEach(() => {
  ["teams", "projects", "__schema__"].forEach(clearNamespace);
});

describe("MockTeamProvider", () => {
  const provider = new MockTeamProvider();

  it("creates a team with the creator as owner and lists it for the user", () => {
    const t = provider.createTeam({ name: "Acme", ownerUserId: "u1" });
    expect(t.slug).toBe("acme");
    const teams = provider.listTeamsForUser("u1");
    expect(teams.map((x) => x.id)).toContain(t.id);
    const members = provider.listMembers(t.id);
    expect(members).toHaveLength(1);
    expect(members[0].role).toBe("owner");
  });

  it("ensurePersonalTeam is idempotent", () => {
    const a = provider.ensurePersonalTeam({ id: "u1", name: "Ada", email: "a@x.com" });
    const b = provider.ensurePersonalTeam({ id: "u1", name: "Ada", email: "a@x.com" });
    expect(a.id).toBe(b.id);
    expect(a.personal).toBe(true);
  });

  it("prevents removing the only owner", () => {
    const t = provider.createTeam({ name: "Solo", ownerUserId: "u1" });
    expect(() => provider.removeMember(t.id, "u1")).toThrow();
  });

  it("invitation lifecycle: create → accept → member added", () => {
    const t = provider.createTeam({ name: "Beta", ownerUserId: "owner" });
    const inv = provider.createInvitation({ teamId: t.id, email: "Guest@X.com", role: "developer", invitedBy: "owner" });
    expect(inv.status).toBe("pending");
    expect(provider.getInvitationByToken(inv.token)?.id).toBe(inv.id);
    const { member } = provider.acceptInvitation(inv.token, { id: "guest", email: "guest@x.com" });
    expect(member.role).toBe("developer");
    expect(provider.listMembers(t.id).map((m) => m.userId)).toContain("guest");
    expect(provider.getInvitationByToken(inv.token)?.status).toBe("accepted");
  });

  it("rejects accepting an invitation under a different email", () => {
    const t = provider.createTeam({ name: "Gamma", ownerUserId: "owner" });
    const inv = provider.createInvitation({ teamId: t.id, email: "a@x.com", role: "viewer", invitedBy: "owner" });
    expect(() => provider.acceptInvitation(inv.token, { id: "u", email: "b@x.com" })).toThrow();
  });

  it("revoking an invitation marks it revoked", () => {
    const t = provider.createTeam({ name: "Delta", ownerUserId: "owner" });
    const inv = provider.createInvitation({ teamId: t.id, email: "a@x.com", role: "viewer", invitedBy: "owner" });
    provider.revokeInvitation(inv.id);
    expect(provider.getInvitationByToken(inv.token)?.status).toBe("revoked");
  });

  it("deletes a non-personal team and cascades members + invites", () => {
    const t = provider.createTeam({ name: "Eps", ownerUserId: "owner" });
    provider.createInvitation({ teamId: t.id, email: "x@x.com", role: "viewer", invitedBy: "owner" });
    provider.deleteTeam(t.id);
    expect(provider.getTeam(t.id)).toBeNull();
    expect(provider.listMembers(t.id)).toHaveLength(0);
    expect(provider.listInvitations(t.id)).toHaveLength(0);
  });

  it("refuses to delete a personal workspace", () => {
    const t = provider.ensurePersonalTeam({ id: "u1", name: "U", email: "u@x.com" });
    expect(() => provider.deleteTeam(t.id)).toThrow();
  });
});

describe("teamPermissions matrix", () => {
  it("only owners and admins can invite", () => {
    expect(can("owner", "members.invite")).toBe(true);
    expect(can("admin", "members.invite")).toBe(true);
    expect(can("developer", "members.invite")).toBe(false);
    expect(can("viewer", "members.invite")).toBe(false);
  });
  it("only owners can manage billing or delete the team", () => {
    expect(can("owner", "team.billing")).toBe(true);
    expect(can("admin", "team.billing")).toBe(false);
    expect(can("owner", "team.delete")).toBe(true);
    expect(can("admin", "team.delete")).toBe(false);
  });
  it("developers can create and edit projects but not delete them", () => {
    expect(can("developer", "projects.create")).toBe(true);
    expect(can("developer", "projects.edit")).toBe(true);
    expect(can("developer", "projects.delete")).toBe(false);
  });
  it("viewers can only view", () => {
    expect(can("viewer", "projects.view")).toBe(true);
    expect(can("viewer", "projects.create")).toBe(false);
  });
  it("null role denies everything", () => {
    expect(can(null, "projects.view")).toBe(false);
  });
});

describe("workspaceEntitlements", () => {
  it("free plan is single-seat and blocks invites", () => {
    const t = teamProvider.createTeam({ name: "Free", ownerUserId: "u1", plan: "free" });
    const r = checkWorkspaceLimit(t.id, "addMember");
    expect(r.allowed).toBe(false);
  });

  it("business plan allows invites up to the seat cap", () => {
    const t = teamProvider.createTeam({ name: "Biz", ownerUserId: "u1", plan: "business" });
    const r = checkWorkspaceLimit(t.id, "addMember");
    expect(r.allowed).toBe(true);
    expect(r.limit).toBe(getWorkspaceLimits("business").maxMembers);
  });

  it("enforces project caps per workspace", () => {
    const t = teamProvider.createTeam({ name: "Cap", ownerUserId: "u1", plan: "free" });
    for (let i = 0; i < 3; i++) {
      projectRepository.create({ name: `p${i}`, type: "webapp" }, { teamId: t.id, ownerId: "u1" });
    }
    expect(checkWorkspaceLimit(t.id, "createProject").allowed).toBe(false);
  });

  it("createWorkspace limit reflects owner's other non-personal teams", () => {
    const personal = teamProvider.ensurePersonalTeam({ id: "u1", name: "U", email: "u@x.com" });
    // Personal stays plan=free → 0 team workspaces allowed.
    expect(checkWorkspaceLimit(personal.id, "createWorkspace").allowed).toBe(false);
  });
});

describe("projectRepository team scoping", () => {
  it("scopes list() by teamId and stamps createdBy on create()", () => {
    const a = projectRepository.create({ name: "A", type: "webapp" }, { teamId: "t1", createdBy: "u1" });
    projectRepository.create({ name: "B", type: "webapp" }, { teamId: "t2", createdBy: "u2" });
    const scoped = projectRepository.list({ teamId: "t1" });
    expect(scoped).toHaveLength(1);
    expect(scoped[0].id).toBe(a.id);
    expect(a.createdBy).toBe("u1");
  });

  it("assignOrphansToTeam backfills any project missing teamId", () => {
    projectRepository.create({ name: "Legacy", type: "webapp" });
    projectRepository.assignOrphansToTeam("home");
    expect(projectRepository.list({ teamId: "home" })).toHaveLength(1);
  });
});
