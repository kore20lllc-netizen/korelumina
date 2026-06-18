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

export function getRuntimeCaller(
  req: Request,
): RuntimeCaller {
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
