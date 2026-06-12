import { NotImplementedError } from "@/lib/errors";
import type { TeamProvider } from "@/providers/types";

const nope = (n: string): never => { throw new NotImplementedError(`SupabaseTeamProvider.${n}`); };

/** Stub — swap in by changing providers/registry.ts. Real implementation
 *  wraps the `teams`, `team_members`, and `invitations` tables behind RLS. */
export class SupabaseTeamProvider implements TeamProvider {
  listTeamsForUser() { return []; }
  getTeam() { return null; }
  createTeam(): ReturnType<TeamProvider["createTeam"]> { return nope("createTeam"); }
  updateTeam(): ReturnType<TeamProvider["updateTeam"]> { return nope("updateTeam"); }
  deleteTeam() { nope("deleteTeam"); }
  listMembers() { return []; }
  addMember(): ReturnType<TeamProvider["addMember"]> { return nope("addMember"); }
  updateMemberRole(): ReturnType<TeamProvider["updateMemberRole"]> { return nope("updateMemberRole"); }
  removeMember() { nope("removeMember"); }
  leaveTeam() { nope("leaveTeam"); }
  listInvitations() { return []; }
  listInvitationsForEmail() { return []; }
  getInvitationByToken() { return null; }
  createInvitation(): ReturnType<TeamProvider["createInvitation"]> { return nope("createInvitation"); }
  acceptInvitation(): ReturnType<TeamProvider["acceptInvitation"]> { return nope("acceptInvitation"); }
  revokeInvitation() { nope("revokeInvitation"); }
  ensurePersonalTeam(): ReturnType<TeamProvider["ensurePersonalTeam"]> { return nope("ensurePersonalTeam"); }
  onChange() { return () => {}; }
}