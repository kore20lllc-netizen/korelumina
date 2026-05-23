import type { TeamPlan } from "@/providers/types";
import { team as teamProvider } from "@/providers/team-registry";
import { projectRepository } from "@/services/projectRepository";

export interface WorkspaceLimits {
  /** Max members (including the owner). `Infinity` = unlimited. */
  maxMembers: number;
  /** Max projects in this workspace. `Infinity` = unlimited. */
  maxProjects: number;
  /** Max additional non-personal workspaces an owner on this plan may create. */
  maxTeamWorkspaces: number;
  /** Whether plan can invite collaborators (false = single-seat only). */
  canInviteMembers: boolean;
}

const LIMITS: Record<TeamPlan, WorkspaceLimits> = {
  free:       { maxMembers: 1,        maxProjects: 3,         maxTeamWorkspaces: 0,        canInviteMembers: false },
  pro:        { maxMembers: 1,        maxProjects: 25,        maxTeamWorkspaces: 0,        canInviteMembers: false },
  business:   { maxMembers: 25,       maxProjects: 200,       maxTeamWorkspaces: 5,        canInviteMembers: true  },
  enterprise: { maxMembers: Infinity, maxProjects: Infinity,  maxTeamWorkspaces: Infinity, canInviteMembers: true  },
};

export function getWorkspaceLimits(plan: TeamPlan): WorkspaceLimits {
  return LIMITS[plan] ?? LIMITS.free;
}

export interface LimitCheck { allowed: boolean; current: number; limit: number; reason?: string }

type Action = "addMember" | "createProject" | "createWorkspace";

export function checkWorkspaceLimit(
  teamId: string,
  action: Action,
): LimitCheck {
  const team = teamProvider.getTeam(teamId);
  if (!team) return { allowed: false, current: 0, limit: 0, reason: "Workspace not found." };
  const limits = getWorkspaceLimits(team.plan);

  switch (action) {
    case "addMember": {
      if (!limits.canInviteMembers) {
        return { allowed: false, current: 0, limit: 0, reason: `The ${team.plan} plan is single-seat. Upgrade to Business to invite teammates.` };
      }
      const current = teamProvider.listMembers(teamId).length;
      const allowed = current < limits.maxMembers;
      return {
        allowed,
        current,
        limit: limits.maxMembers,
        reason: allowed ? undefined : `Workspace is at its ${limits.maxMembers}-member cap. Upgrade for more seats.`,
      };
    }
    case "createProject": {
      const current = projectRepository.list({ teamId }).length;
      const allowed = current < limits.maxProjects;
      return {
        allowed,
        current,
        limit: limits.maxProjects,
        reason: allowed ? undefined : `Workspace is at its ${limits.maxProjects}-project cap.`,
      };
    }
    case "createWorkspace": {
      // Count owner's non-personal workspaces.
      const owned = teamProvider
        .listTeamsForUser(team.ownerUserId)
        .filter((t) => !t.personal && t.ownerUserId === team.ownerUserId);
      const current = owned.length;
      const allowed = current < limits.maxTeamWorkspaces;
      return {
        allowed,
        current,
        limit: limits.maxTeamWorkspaces,
        reason: allowed ? undefined : `Your plan allows ${limits.maxTeamWorkspaces} team workspaces. Upgrade to add more.`,
      };
    }
  }
}
