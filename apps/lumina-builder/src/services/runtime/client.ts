import { auth, usesVerifiedSessions } from "@/providers/auth-registry";
import { getActiveTeamId } from "@/context/ActiveTeamContext";
import { getCurrentRole } from "@/services/workspaceAccessService";

export const RUNTIME_API =
  import.meta.env.VITE_RUNTIME_API_URL ||
  "http://localhost:4100";

/*
 * SEC-1d (ADR-0043 Decision 1): with real sign-in the Builder sends the
 * person's Supabase session token and never a role, user or team header;
 * Runtime verifies the token and reads the role assigned server-side.
 *
 * The mock sign-in (development builds only; production forbids it) has no
 * real token, so it keeps the legacy headers, which Runtime believes only
 * on this machine and only while no identity provider is configured.
 */
function runtimeCallerHeaders(
  extra?: HeadersInit,
): HeadersInit {
  if (usesVerifiedSessions) {
    const token = auth.getSession?.()?.token;

    return {
      ...(extra ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

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
