import { AppError } from "@/lib/errors";
import { readJSON, writeJSON, subscribe, uid } from "@/lib/persistence";
import type {
  Invitation,
  Team,
  TeamMember,
  TeamPlan,
  TeamProvider,
  TeamRole,
} from "@/providers/types";

const NS = "teams";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "team";

function loadTeams(): Team[] { return readJSON<Team[]>(NS, "teams", []); }
function saveTeams(t: Team[]) { writeJSON(NS, "teams", t); }
function loadMembers(): TeamMember[] { return readJSON<TeamMember[]>(NS, "members", []); }
function saveMembers(m: TeamMember[]) { writeJSON(NS, "members", m); }
function loadInvites(): Invitation[] { return readJSON<Invitation[]>(NS, "invites", []); }
function saveInvites(i: Invitation[]) { writeJSON(NS, "invites", i); }

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function ensureUniqueSlug(base: string): string {
  const teams = loadTeams();
  if (!teams.some((t) => t.slug === base)) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}-${i}`;
    if (!teams.some((t) => t.slug === candidate)) return candidate;
  }
  return `${base}-${uid("s").slice(-4)}`;
}

export class MockTeamProvider implements TeamProvider {
  listTeamsForUser(userId: string): Team[] {
    const teamIds = new Set(loadMembers().filter((m) => m.userId === userId).map((m) => m.teamId));
    return loadTeams()
      .filter((t) => teamIds.has(t.id))
      .sort((a, b) => {
        if (a.personal !== b.personal) return a.personal ? -1 : 1;
        return a.createdAt - b.createdAt;
      });
  }

  getTeam(teamId: string): Team | null {
    return loadTeams().find((t) => t.id === teamId) ?? null;
  }

  createTeam(input: { name: string; ownerUserId: string; personal?: boolean; plan?: TeamPlan }): Team {
    const name = input.name.trim() || "Untitled Workspace";
    const team: Team = {
      id: uid("team"),
      name,
      slug: ensureUniqueSlug(slugify(name)),
      plan: input.plan ?? "free",
      ownerUserId: input.ownerUserId,
      personal: !!input.personal,
      createdAt: Date.now(),
    };
    saveTeams([...loadTeams(), team]);
    const member: TeamMember = {
      id: uid("tm"),
      teamId: team.id,
      userId: input.ownerUserId,
      role: "owner",
      joinedAt: Date.now(),
    };
    saveMembers([...loadMembers(), member]);
    return team;
  }

  updateTeam(teamId: string, patch: Partial<Pick<Team, "name" | "slug" | "plan">>): Team {
    const teams = loadTeams();
    const i = teams.findIndex((t) => t.id === teamId);
    if (i < 0) throw new AppError("NOT_FOUND", "Workspace not found.");
    const next: Team = { ...teams[i], ...patch };
    if (patch.slug) next.slug = slugify(patch.slug);
    teams[i] = next;
    saveTeams(teams);
    return next;
  }

  deleteTeam(teamId: string): void {
    const team = this.getTeam(teamId);
    if (!team) return;
    if (team.personal) throw new AppError("VALIDATION", "Personal workspaces cannot be deleted.");
    saveTeams(loadTeams().filter((t) => t.id !== teamId));
    saveMembers(loadMembers().filter((m) => m.teamId !== teamId));
    saveInvites(loadInvites().filter((i) => i.teamId !== teamId));
  }

  listMembers(teamId: string): TeamMember[] {
    return loadMembers().filter((m) => m.teamId === teamId).sort((a, b) => a.joinedAt - b.joinedAt);
  }

  addMember(input: { teamId: string; userId: string; role: TeamRole }): TeamMember {
    const members = loadMembers();
    const existing = members.find((m) => m.teamId === input.teamId && m.userId === input.userId);
    if (existing) return existing;
    const m: TeamMember = {
      id: uid("tm"),
      teamId: input.teamId,
      userId: input.userId,
      role: input.role,
      joinedAt: Date.now(),
    };
    saveMembers([...members, m]);
    return m;
  }

  updateMemberRole(teamId: string, userId: string, role: TeamRole): TeamMember {
    const members = loadMembers();
    const i = members.findIndex((m) => m.teamId === teamId && m.userId === userId);
    if (i < 0) throw new AppError("NOT_FOUND", "Member not found.");
    if (members[i].role === "owner" && role !== "owner") {
      const otherOwner = members.some((m) => m.teamId === teamId && m.userId !== userId && m.role === "owner");
      if (!otherOwner) throw new AppError("VALIDATION", "A workspace must have at least one owner.");
    }
    members[i] = { ...members[i], role };
    saveMembers(members);
    return members[i];
  }

  removeMember(teamId: string, userId: string): void {
    const members = loadMembers();
    const target = members.find((m) => m.teamId === teamId && m.userId === userId);
    if (!target) return;
    if (target.role === "owner") {
      const otherOwner = members.some((m) => m.teamId === teamId && m.userId !== userId && m.role === "owner");
      if (!otherOwner) throw new AppError("VALIDATION", "Cannot remove the only owner.");
    }
    saveMembers(members.filter((m) => !(m.teamId === teamId && m.userId === userId)));
  }

  leaveTeam(teamId: string, userId: string): void {
    this.removeMember(teamId, userId);
  }

  listInvitations(teamId: string): Invitation[] {
    return loadInvites().filter((i) => i.teamId === teamId).sort((a, b) => b.createdAt - a.createdAt);
  }

  listInvitationsForEmail(email: string): Invitation[] {
    const e = email.trim().toLowerCase();
    return loadInvites().filter((i) => i.email.toLowerCase() === e && i.status === "pending");
  }

  getInvitationByToken(token: string): Invitation | null {
    if (!token) return null;
    return loadInvites().find((i) => i.token === token) ?? null;
  }

  createInvitation(input: { teamId: string; email: string; role: TeamRole; invitedBy: string }): Invitation {
    const email = input.email.trim().toLowerCase();
    if (!email.includes("@")) throw new AppError("VALIDATION", "Enter a valid email.");
    const team = this.getTeam(input.teamId);
    if (!team) throw new AppError("NOT_FOUND", "Workspace not found.");
    const dupe = loadInvites().find(
      (i) => i.teamId === input.teamId && i.email.toLowerCase() === email && i.status === "pending",
    );
    if (dupe) return dupe;
    const inv: Invitation = {
      id: uid("inv"),
      teamId: input.teamId,
      email,
      role: input.role,
      token: uid("tok").slice(-12),
      status: "pending",
      invitedBy: input.invitedBy,
      createdAt: Date.now(),
      expiresAt: Date.now() + INVITE_TTL_MS,
    };
    saveInvites([...loadInvites(), inv]);
    return inv;
  }

  acceptInvitation(token: string, user: { id: string; email: string }): { team: Team; member: TeamMember } {
    const invites = loadInvites();
    const i = invites.findIndex((x) => x.token === token);
    if (i < 0) throw new AppError("NOT_FOUND", "Invitation not found.");
    const inv = invites[i];
    if (inv.status !== "pending") throw new AppError("VALIDATION", "Invitation is no longer valid.");
    if (inv.expiresAt < Date.now()) {
      invites[i] = { ...inv, status: "expired" };
      saveInvites(invites);
      throw new AppError("VALIDATION", "Invitation has expired.");
    }
    if (inv.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new AppError("VALIDATION", "This invitation was sent to a different email.");
    }
    const team = this.getTeam(inv.teamId);
    if (!team) throw new AppError("NOT_FOUND", "Workspace no longer exists.");
    const member = this.addMember({ teamId: inv.teamId, userId: user.id, role: inv.role });
    invites[i] = { ...inv, status: "accepted" };
    saveInvites(invites);
    return { team, member };
  }

  revokeInvitation(invitationId: string): void {
    const invites = loadInvites();
    const i = invites.findIndex((x) => x.id === invitationId);
    if (i < 0) return;
    invites[i] = { ...invites[i], status: "revoked" };
    saveInvites(invites);
  }

  ensurePersonalTeam(user: { id: string; name: string; email: string }): Team {
    const existing = loadTeams().find((t) => t.personal && t.ownerUserId === user.id);
    if (existing) return existing;
    const baseName = user.name?.trim() || user.email.split("@")[0] || "Personal";
    return this.createTeam({
      name: `${baseName}'s Workspace`,
      ownerUserId: user.id,
      personal: true,
      plan: "free",
    });
  }

  onChange(cb: () => void): () => void { return subscribe(NS, cb); }
}