import type { Express, Request, Response } from "express";

import { resolveRuntimeCallerFor } from "./runtimeCaller.js";
import type { SupabaseAccessTokenVerifier } from "./supabaseAccessToken.js";

/*
 * SEC-1d: how Runtime sees the caller, so the owner can check identity
 * without anyone reading configuration. Returns the caller's role and user
 * id and how they were established; never a token or a secret.
 */
export function registerRuntimeIdentityRoute(
  app: Express,
  verifier: SupabaseAccessTokenVerifier,
): void {
  app.get("/api/runtime/identity", (req: Request, res: Response) => {
    const resolution = resolveRuntimeCallerFor(req);
    return res.json({
      ok: true,
      identityProviderConfigured: verifier.configured,
      source: resolution.source,
      ...(resolution.reason ? { reason: resolution.reason } : {}),
      caller: {
        role: resolution.caller.role,
        userId: resolution.caller.userId ?? null,
        supportAccess: resolution.caller.supportAccess,
        adminTools: resolution.caller.adminTools,
      },
    });
  });
}
