import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  supabaseTokenConfigFromEnvironment,
  type SupabaseAccessTokenVerifier,
} from "./supabaseAccessToken.js";

export type RuntimeCallerRole =
  | "user"
  | "pro"
  | "business"
  | "enterprise"
  | "inhouse-dev"
  | "admin"
  | "super_admin";

export interface RuntimeCaller {
  userId?: string;
  teamId?: string;
  role: RuntimeCallerRole;
  supportAccess: boolean;
  adminTools: boolean;
}

function readHeader(
  req: Request,
  name: string,
): string | undefined {
  const value =
    req.header(name)?.trim();

  return value || undefined;
}

function normalizeRole(
  value?: string,
): RuntimeCallerRole {
  switch (value) {
    case "user":
    case "pro":
    case "business":
    case "enterprise":
    case "inhouse-dev":
    case "admin":
    case "super_admin":
      return value;
    default:
      return "user";
  }
}

function isLoopbackAddress(
  address?: string | null,
): boolean {
  return (
    address === "127.0.0.1" ||
    address === "::1" ||
    address === "::ffff:127.0.0.1"
  );
}

/*
 * SEC-1b: the caller headers (role, user, team) are sent by the browser
 * and nothing verifies them yet, so anyone who could reach Runtime could
 * claim super_admin or another user's id.
 *
 * Until Runtime verifies identity (ADR-0043, Proposed), the headers are
 * believed only from a trusted source: a request carrying the Runtime
 * internal token, or a request from this machine while Runtime is not in
 * production. Anything else is an anonymous plain user.
 */
export function isTrustedCallerSource(
  req: Request,
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  const expectedToken =
    environment.KORELUMINA_RUNTIME_INTERNAL_TOKEN;

  if (
    expectedToken &&
    req.header("x-korelumina-runtime-token") === expectedToken
  ) {
    return true;
  }

  /*
   * SEC-1d (ADR-0043 Decision 1): once Runtime can verify sessions
   * (SUPABASE_URL configured), headers are never believed from the
   * browser, not even on this machine. Without an identity provider, local
   * development on this machine keeps the header path.
   */
  return (
    environment.NODE_ENV !== "production" &&
    !supabaseTokenConfigFromEnvironment(environment).url &&
    isLoopbackAddress(
      req.socket?.remoteAddress,
    )
  );
}

const ANONYMOUS_CALLER: RuntimeCaller = {
  role: "user",
  supportAccess: false,
  adminTools: false,
};

function callerFor(
  role: RuntimeCallerRole,
  userId?: string,
  teamId?: string,
): RuntimeCaller {
  return {
    userId,
    teamId,
    role,
    supportAccess:
      role === "inhouse-dev" ||
      role === "admin" ||
      role === "super_admin",
    adminTools:
      role === "admin" ||
      role === "super_admin",
  };
}

/*
 * SEC-1c (ADR-0043 Decision 5): outside production, this machine may act as
 * a development identity configured in Runtime's environment, for example
 * KORELUMINA_DEV_IDENTITY=super_admin:usr_owner. It is never chosen by the
 * browser and production refuses it.
 */
export function developmentIdentity(
  environment: NodeJS.ProcessEnv = process.env,
): RuntimeCaller | null {
  if (environment.NODE_ENV === "production") return null;
  const configured = environment.KORELUMINA_DEV_IDENTITY?.trim();
  if (!configured) return null;
  const [role, userId] = configured.split(":");
  return callerFor(normalizeRole(role), userId?.trim() || undefined);
}

export type RuntimeCallerSource =
  | "verified-token"
  | "rejected-token"
  | "internal-token"
  | "development-identity"
  | "local-headers"
  | "anonymous";

export interface RuntimeCallerResolution {
  caller: RuntimeCaller;
  source: RuntimeCallerSource;
  reason?: string;
}

const TOKEN_RESOLUTION = Symbol("korelumina.tokenResolution");

type RequestWithCaller = Request & {
  [TOKEN_RESOLUTION]?: RuntimeCallerResolution;
};

/*
 * SEC-1c (ADR-0043 Decisions 1, 2, 3): a request that carries a Supabase
 * access token is identified by that token alone. A valid token makes the
 * caller its subject, with the role from app_metadata (a plan role such as
 * "free" is a plain user). A present but invalid token makes the caller
 * anonymous; it never falls back to headers. Team ids are not accepted
 * from verified callers until Runtime keeps team membership (Decision 4).
 */
export function resolveRuntimeCaller(
  verifier: SupabaseAccessTokenVerifier,
) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    const authorization = req.header("authorization")?.trim();

    if (!authorization || !/^Bearer\s+/i.test(authorization)) {
      return next();
    }

    const token = authorization.replace(/^Bearer\s+/i, "").trim();

    try {
      const verification = await verifier.verify(token);
      (req as RequestWithCaller)[TOKEN_RESOLUTION] = verification.ok
        ? {
            caller: callerFor(normalizeRole(verification.identity.role ?? undefined), verification.identity.userId),
            source: "verified-token",
          }
        : { caller: { ...ANONYMOUS_CALLER }, source: "rejected-token", reason: verification.reason };
    } catch (error) {
      (req as RequestWithCaller)[TOKEN_RESOLUTION] = {
        caller: { ...ANONYMOUS_CALLER },
        source: "rejected-token",
        reason: error instanceof Error ? error.message : String(error),
      };
    }

    return next();
  };
}

/*
 * Who is calling, and how Runtime knows. In order: a verified (or rejected)
 * session token; the Runtime internal token (machine callers, which may
 * act for a person through headers); a development identity configured in
 * Runtime's environment on this machine outside production; local headers
 * on this machine only while no identity provider is configured;
 * otherwise an anonymous plain user.
 */
export function resolveRuntimeCallerFor(
  req: Request,
  environment: NodeJS.ProcessEnv = process.env,
): RuntimeCallerResolution {
  const fromToken = (req as RequestWithCaller)[TOKEN_RESOLUTION];
  if (fromToken) {
    return { ...fromToken, caller: { ...fromToken.caller } };
  }

  const internalToken = environment.KORELUMINA_RUNTIME_INTERNAL_TOKEN;
  const usesInternalToken =
    Boolean(internalToken) &&
    req.header("x-korelumina-runtime-token") === internalToken;

  if (!usesInternalToken && isLoopbackAddress(req.socket?.remoteAddress)) {
    const development = developmentIdentity(environment);
    if (development) {
      return { caller: development, source: "development-identity" };
    }
  }

  if (!isTrustedCallerSource(req, environment)) {
    return { caller: { ...ANONYMOUS_CALLER }, source: "anonymous" };
  }

  return {
    caller: callerFor(
      normalizeRole(readHeader(req, "x-korelumina-role")),
      readHeader(req, "x-korelumina-user-id"),
      readHeader(req, "x-korelumina-team-id"),
    ),
    source: usesInternalToken ? "internal-token" : "local-headers",
  };
}

export function getRuntimeCaller(
  req: Request,
): RuntimeCaller {
  return resolveRuntimeCallerFor(req).caller;
}
