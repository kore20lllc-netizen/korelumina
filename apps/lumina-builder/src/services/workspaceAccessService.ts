export type WorkspaceRole =
  | "user"
  | "pro"
  | "business"
  | "enterprise"
  | "inhouse-dev"
  | "admin"
  | "super_admin";

export interface WorkspaceCapabilities {
  dashboard: boolean;
  designer: boolean;
  developer: boolean;
  ai: boolean;
  repoAudit: boolean;
  securityAudit: boolean;
  repairConsole: boolean;
  deploymentDiagnostics: boolean;
  supportAccess: boolean;
  adminTools: boolean;
  fullscreenPreview: boolean;
  browserPreview: boolean;
  customSlug: boolean;
  brandedPreviewUrl: boolean;
  mobilePackaging: boolean;
  inhouseDevDashboard: boolean;
}

const BASE: WorkspaceCapabilities = {
  dashboard: true,
  designer: true,
  developer: true,
  ai: true,
  repoAudit: false,
  securityAudit: false,
  repairConsole: false,
  deploymentDiagnostics: false,
  supportAccess: false,
  adminTools: false,
  fullscreenPreview: false,
  browserPreview: false,
  customSlug: false,
  brandedPreviewUrl: false,
  mobilePackaging: false,
  inhouseDevDashboard: false,
};

import { auth } from "@/providers/auth-registry";

/*
 * SEC-1b: the role comes from the signed-in user. A visitor who is not
 * signed in is a plain "user" (it used to be "inhouse-dev", which reached
 * internal engineering surfaces and, in Runtime, every project).
 *
 * Choosing a role in the browser (the Settings role switcher, the
 * localStorage "korelumina:role" override, the simulated checkout) is a
 * development convenience only. Production builds ignore it: roles are
 * assigned by KoreLumina, not by the client (ADR-0043, Proposed).
 */
const ROLES: readonly WorkspaceRole[] = [
  "user",
  "pro",
  "business",
  "enterprise",
  "inhouse-dev",
  "admin",
  "super_admin",
];

export const SIGNED_OUT_ROLE: WorkspaceRole = "user";

const buildEnv =
  (import.meta as {
    env?: Record<string, string | boolean | undefined>;
  }).env ?? {};

export const roleSwitchingAllowed: boolean =
  buildEnv.DEV === true;

function asWorkspaceRole(value: unknown): WorkspaceRole | null {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value)
    ? (value as WorkspaceRole)
    : null;
}

function readDevelopmentRoleOverride(): WorkspaceRole | null {
  if (!roleSwitchingAllowed || typeof window === "undefined") return null;
  try {
    return asWorkspaceRole(window.localStorage.getItem("korelumina:role"));
  } catch {
    return null;
  }
}

let currentRole: WorkspaceRole =
  readDevelopmentRoleOverride() ?? SIGNED_OUT_ROLE;

export function getCurrentRole(): WorkspaceRole {
  const u = auth.getUser();
  /* A role the platform does not know ("free", or anything unexpected) is a plain user. */
  if (u) return asWorkspaceRole(u.role) ?? SIGNED_OUT_ROLE;
  return currentRole;
}

export function setCurrentRole(role: WorkspaceRole) {
  if (!roleSwitchingAllowed) {
    console.warn("[KoreLumina] Roles are assigned by KoreLumina, not changed in the browser.");
    return;
  }
  currentRole = role;
  try { window.localStorage.setItem("korelumina:role", role); } catch {}
  // Reflect into auth provider if signed in so entitlements stay consistent.
  if (auth.getUser()) void auth.setRole(role as never);
}

export function getCapabilities(role: WorkspaceRole = getCurrentRole()): WorkspaceCapabilities {
  switch (role) {
    case "super_admin":
      return {
        dashboard: true, designer: true, developer: true, ai: true,
        repoAudit: true, securityAudit: true, repairConsole: true,
        deploymentDiagnostics: true, supportAccess: true, adminTools: true,
        fullscreenPreview: true, browserPreview: true, customSlug: true, brandedPreviewUrl: true,
        mobilePackaging: true, inhouseDevDashboard: true,
      };
    case "admin":
      return {
        dashboard: true, designer: true, developer: true, ai: true,
        repoAudit: false, securityAudit: false, repairConsole: false,
        deploymentDiagnostics: true, supportAccess: true, adminTools: true,
        fullscreenPreview: true, browserPreview: true, customSlug: true, brandedPreviewUrl: true,
        mobilePackaging: true, inhouseDevDashboard: false,
      };
    case "inhouse-dev":
      return {
        dashboard: true, designer: true, developer: true, ai: true,
        repoAudit: true, securityAudit: true, repairConsole: true,
        deploymentDiagnostics: true, supportAccess: true, adminTools: false,
        fullscreenPreview: true, browserPreview: true, customSlug: true, brandedPreviewUrl: true,
        mobilePackaging: true, inhouseDevDashboard: true,
      };
    case "enterprise":
      return { ...BASE, fullscreenPreview: true, browserPreview: true, customSlug: true, brandedPreviewUrl: true };
    case "business":
      return { ...BASE, fullscreenPreview: true, browserPreview: true, customSlug: true, brandedPreviewUrl: true };
    case "pro":
      return { ...BASE, fullscreenPreview: true, browserPreview: true, customSlug: true };
    case "user":
    default:
      return { ...BASE };
  }
}

export function canAccess(capability: keyof WorkspaceCapabilities): boolean {
  return getCapabilities(getCurrentRole())[capability] === true;
}

export function hasAnyInternalCapability(caps = getCapabilities()): boolean {
  return caps.repoAudit || caps.securityAudit || caps.repairConsole ||
    caps.deploymentDiagnostics || caps.supportAccess || caps.adminTools;
}
/*
 * MS-2026-0006: the subscription plan is the plan role, assigned by billing
 * (ADR-0043); every other role is on the free plan.
 */
export type WorkspacePlan = "free" | "pro" | "business" | "enterprise";

export function planForRole(role: WorkspaceRole): WorkspacePlan {
  return role === "pro" || role === "business" || role === "enterprise" ? role : "free";
}
