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

/** Role is sourced from the AuthProvider when a session exists; otherwise
 *  falls back to the legacy localStorage override (kept for dev/demo). */
import { auth } from "@/providers/auth-registry";

const FALLBACK: WorkspaceRole =
  (typeof window !== "undefined" &&
    (window.localStorage.getItem("korelumina:role") as WorkspaceRole | null)) ||
  "inhouse-dev";

let currentRole: WorkspaceRole = FALLBACK;

export function getCurrentRole(): WorkspaceRole {
  const u = auth.getUser();
  if (u) return u.role as WorkspaceRole;
  return currentRole;
}

export function setCurrentRole(role: WorkspaceRole) {
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