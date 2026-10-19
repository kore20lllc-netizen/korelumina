import type {
  Request,
} from "express";

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

export function getRuntimeCaller(
  req: Request,
): RuntimeCaller {
  if (!isTrustedCallerSource(req)) {
    return { ...ANONYMOUS_CALLER };
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
