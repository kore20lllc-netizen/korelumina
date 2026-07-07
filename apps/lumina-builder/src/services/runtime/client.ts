import { auth } from "@/providers/auth-registry";
import { getActiveTeamId } from "@/context/ActiveTeamContext";
import { getCurrentRole } from "@/services/workspaceAccessService";

export const RUNTIME_API =
  import.meta.env.VITE_RUNTIME_API_URL ||
  "http://localhost:4100";

function runtimeCallerHeaders(
  extra?: HeadersInit,
): HeadersInit {
  const user = auth.getUser?.();

  const teamId = getActiveTeamId();

  return {
    ...(extra ?? {}),
    "x-korelumina-user-id":
      user?.id ?? "",
    "x-korelumina-team-id":
      teamId ?? "",
    "x-korelumina-role":
      getCurrentRole(),
  };
}

export function getRuntimeCallerHeaders(
  extra?: HeadersInit,
): HeadersInit {
  return runtimeCallerHeaders(extra);
}
