import type {
  NextFunction,
  Request,
  Response,
} from "express";

import type {
  SupabaseAccessTokenVerifier,
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

  return (
    environment.NODE_ENV !== "production" &&
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

const VERIFIED_CALLER = Symbol("korelumina.verifiedCaller");

type RequestWithCaller = Request & {
  [VERIFIED_CALLER]?: RuntimeCaller;
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
      (req as RequestWithCaller)[VERIFIED_CALLER] = verification.ok
        ? callerFor(normalizeRole(verification.identity.role ?? undefined), verification.identity.userId)
        : { ...ANONYMOUS_CALLER };
    } catch {
      (req as RequestWithCaller)[VERIFIED_CALLER] = { ...ANONYMOUS_CALLER };
    }

    return next();
  };
}

export function getRuntimeCaller(
  req: Request,
): RuntimeCaller {
  const verified = (req as RequestWithCaller)[VERIFIED_CALLER];
  if (verified) {
    return { ...verified };
  }

  if (!isTrustedCallerSource(req)) {
    return { ...ANONYMOUS_CALLER };
  }

  /* SEC-1c: on this machine a configured development identity wins over headers. */
  const internalToken = process.env.KORELUMINA_RUNTIME_INTERNAL_TOKEN;
  const usesInternalToken =
    Boolean(internalToken) &&
    req.header("x-korelumina-runtime-token") === internalToken;
  const development = usesInternalToken ? null : developmentIdentity();
  if (development) {
    return development;
  }

  const role =
    normalizeRole(
      readHeader(
        req,
        "x-korelumina-role",
      ),
    );

  return {
    userId: readHeader(
      req,
      "x-korelumina-user-id",
    ),
    teamId: readHeader(
      req,
      "x-korelumina-team-id",
    ),
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
