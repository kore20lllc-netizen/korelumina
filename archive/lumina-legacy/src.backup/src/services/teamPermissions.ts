import type { TeamRole } from "@/providers/types";

/** Atomic actions a member can attempt inside a workspace. */
export type TeamAction =
  | "team.manage"
  | "team.delete"
  | "team.billing"
  | "members.invite"
  | "members.changeRole"
  | "members.remove"
  | "projects.create"
  | "projects.edit"
  | "projects.delete"
  | "projects.view";

const MATRIX: Record<TeamRole, Record<TeamAction, boolean>> = {
  owner: {
    "team.manage": true,
    "team.delete": true,
    "team.billing": true,
    "members.invite": true,
    "members.changeRole": true,
    "members.remove": true,
    "projects.create": true,
    "projects.edit": true,
    "projects.delete": true,
    "projects.view": true,
  },
  admin: {
    "team.manage": true,
    "team.delete": false,
    "team.billing": false,
    "members.invite": true,
    "members.changeRole": true,
    "members.remove": true,
    "projects.create": true,
    "projects.edit": true,
    "projects.delete": true,
    "projects.view": true,
  },
  developer: {
    "team.manage": false,
    "team.delete": false,
    "team.billing": false,
    "members.invite": false,
    "members.changeRole": false,
    "members.remove": false,
    "projects.create": true,
    "projects.edit": true,
    "projects.delete": false,
    "projects.view": true,
  },
  viewer: {
    "team.manage": false,
    "team.delete": false,
    "team.billing": false,
    "members.invite": false,
    "members.changeRole": false,
    "members.remove": false,
    "projects.create": false,
    "projects.edit": false,
    "projects.delete": false,
    "projects.view": true,
  },
};

export function can(role: TeamRole | null | undefined, action: TeamAction): boolean {
  if (!role) return false;
  return MATRIX[role]?.[action] === true;
}

export const TEAM_ROLES: TeamRole[] = ["owner", "admin", "developer", "viewer"];

export function roleLabel(role: TeamRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}