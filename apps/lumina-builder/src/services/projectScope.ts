import { auth } from "@/providers/auth-registry";
import { getActiveTeamId } from "@/context/ActiveTeamContext";
import { canAccess } from "@/services/workspaceAccessService";

export interface ProjectScope {
  teamId?: string;
  ownerId?: string;
}

export function getProjectScope(): ProjectScope | undefined {
  if (
    canAccess("adminTools") ||
    canAccess("supportAccess")
  ) {
    return undefined;
  }

  const teamId = getActiveTeamId();

  if (teamId) {
    return { teamId };
  }

  const user = auth.getUser();

  if (user?.id) {
    return { ownerId: user.id };
  }

  return undefined;
}
