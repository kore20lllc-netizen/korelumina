import type { Express, Request, Response } from "express";

import { ConnectionError, ConnectionService } from "../connections/ConnectionService.js";
import { CONNECTION_PROVIDERS, type ConnectionProviderId } from "../connections/ConnectionTypes.js";
import { resolveAllowedRuntimeOrigins } from "./runtimeBoundary.js";
import { getRuntimeCaller } from "./runtimeCaller.js";

/*
 * MS-2026-0016: connected accounts.
 *
 * GET    /api/connections                      the caller's connections (never a token) and readiness
 * GET    /api/connections/uses                 the caller's recent uses
 * POST   /api/connections/:provider/start      the provider page to sign in and grant access
 * GET    /api/connections/:provider/callback   the provider's redirect; back to KoreLumina
 * DELETE /api/connections/:provider            disconnect
 *
 * The callback comes from the provider in the person's browser, so it
 * carries no KoreLumina sign-in: it is bound to the person only by the
 * single-use state issued at start. It always ends with a redirect to the
 * Builder (never to an address taken from the request), carrying only
 * which provider and whether it worked.
 */

function provider(value: unknown): ConnectionProviderId | null {
  return typeof value === "string" && (CONNECTION_PROVIDERS as string[]).includes(value) ? (value as ConnectionProviderId) : null;
}

export function connectionCallbackBase(env: NodeJS.ProcessEnv = process.env): string {
  return (env.KORELUMINA_CONNECTIONS_CALLBACK_BASE?.trim() || `http://localhost:${env.PORT?.trim() || "4100"}`).replace(/\/+$/, "");
}

export function builderReturnUrl(env: NodeJS.ProcessEnv = process.env): string {
  return (env.KORELUMINA_BUILDER_URL?.trim() || resolveAllowedRuntimeOrigins(env.KORELUMINA_RUNTIME_ALLOWED_ORIGINS)[0]).replace(/\/+$/, "");
}

function signedIn(req: Request, res: Response): string | null {
  const caller = getRuntimeCaller(req);
  if (caller.userId) return caller.userId;
  res.status(401).json({ ok: false, error: "authentication_required" });
  return null;
}

function failure(res: Response, error: unknown) {
  const code = error instanceof ConnectionError || error instanceof Error ? error.message : "connection_failed";
  const status = code === "connections_key_missing" || code.startsWith("provider_not_configured") ? 503 : 400;
  return res.status(status).json({ ok: false, error: code });
}

export function registerConnectionRoutes(
  app: Express,
  deps: { service?: ConnectionService; env?: NodeJS.ProcessEnv } = {},
) {
  const service = deps.service ?? new ConnectionService();
  const env = deps.env ?? process.env;
  const redirectUri = (id: ConnectionProviderId) => `${connectionCallbackBase(env)}/api/connections/${id}/callback`;

  app.get("/api/connections", (req, res) => {
    const userId = signedIn(req, res);
    if (!userId) return;
    return res.json({ ok: true, ...service.readiness(), connections: service.list(userId) });
  });

  app.get("/api/connections/uses", (req, res) => {
    const userId = signedIn(req, res);
    if (!userId) return;
    return res.json({ ok: true, uses: service.uses(userId) });
  });

  app.post("/api/connections/:provider/start", (req, res) => {
    const userId = signedIn(req, res);
    if (!userId) return;
    const id = provider(req.params.provider);
    if (!id) return res.status(404).json({ ok: false, error: "unknown_provider" });
    try {
      return res.json({ ok: true, url: service.start(userId, id, redirectUri(id), builderReturnUrl(env)) });
    } catch (error) {
      return failure(res, error);
    }
  });

  app.get("/api/connections/:provider/callback", async (req, res) => {
    const id = provider(req.params.provider);
    const back = new URL(builderReturnUrl(env));
    back.searchParams.set("connection", id ?? "unknown");
    if (!id) {
      back.searchParams.set("connection_result", "unknown_provider");
      return res.redirect(303, back.toString());
    }
    const query = Object.fromEntries(
      Object.entries(req.query).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
    try {
      const done = await service.complete(id, query, redirectUri(id));
      const target = new URL(done.returnTo);
      target.searchParams.set("connection", id);
      target.searchParams.set("connection_result", "connected");
      return res.redirect(303, target.toString());
    } catch (error) {
      const code = error instanceof Error ? error.message.split(":")[0] : "connection_failed";
      console.error(`[connections] ${id} callback refused: ${code}`);
      back.searchParams.set("connection_result", code);
      return res.redirect(303, back.toString());
    }
  });

  app.delete("/api/connections/:provider", async (req, res) => {
    const userId = signedIn(req, res);
    if (!userId) return;
    const id = provider(req.params.provider);
    if (!id) return res.status(404).json({ ok: false, error: "unknown_provider" });
    try {
      return res.json({ ok: true, ...(await service.disconnect(userId, id)) });
    } catch (error) {
      return failure(res, error);
    }
  });
}
