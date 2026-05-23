import { AppError } from "@/lib/errors";
import { auth } from "@/providers/auth-registry";
import { usage } from "@/providers/usage-registry";
import type { Role } from "@/providers/types";

export type EntitlementAction =
  | "ai.execute"
  | "project.create"
  | "preview.browser"
  | "preview.fullscreen"
  | "preview.customSlug"
  | "preview.brandedUrl"
  | "deploy"
  | "transform"
  | "repo.audit"
  | "mobile.package";

export interface EntitlementResult { allowed: boolean; reason?: string; upgradeTo?: Role }

function role(): Role { return auth.getUser()?.role ?? "free"; }

export function checkEntitlement(action: EntitlementAction): EntitlementResult {
  const r = role();
  const u = auth.getUser();
  switch (action) {
    case "ai.execute": {
      if (r !== "free") return { allowed: true };
      const snap = u ? usage.snapshot(u.id) : null;
      if (snap && snap.aiExecutions >= snap.aiLimit) return { allowed: false, reason: `You've used your ${snap.aiLimit} free AI executions.`, upgradeTo: "pro" };
      return { allowed: true };
    }
    case "project.create": {
      if (r !== "free") return { allowed: true };
      const snap = u ? usage.snapshot(u.id) : null;
      if (snap && snap.projects >= snap.projectLimit) return { allowed: false, reason: "Free plan is limited to 1 project.", upgradeTo: "pro" };
      return { allowed: true };
    }
    case "preview.browser":
    case "preview.fullscreen":
    case "preview.customSlug":
      return r === "free" ? { allowed: false, reason: "Available on Pro.", upgradeTo: "pro" } : { allowed: true };
    case "preview.brandedUrl":
      return r === "business" || r === "enterprise" || r === "inhouse-dev" || r === "admin"
        ? { allowed: true } : { allowed: false, reason: "Available on Business.", upgradeTo: "business" };
    case "deploy":
      return r === "free" ? { allowed: false, reason: "Deployments require Pro.", upgradeTo: "pro" } : { allowed: true };
    case "transform":
      return r === "free" ? { allowed: false, reason: "Transform App → Website is a one-time unlock.", upgradeTo: "pro" } : { allowed: true };
    case "repo.audit":
    case "mobile.package":
      return r === "business" || r === "enterprise" || r === "inhouse-dev" || r === "admin"
        ? { allowed: true } : { allowed: false, reason: "Available on Business.", upgradeTo: "business" };
    default:
      return { allowed: true };
  }
}

export function requireEntitlement(action: EntitlementAction): void {
  const r = checkEntitlement(action);
  if (!r.allowed) throw new AppError("ENTITLEMENT_DENIED", r.reason || "Upgrade required.", { recovery: r.upgradeTo ? `Upgrade to ${r.upgradeTo}.` : undefined });
}