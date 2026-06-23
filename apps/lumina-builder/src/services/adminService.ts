import { readJSON, writeJSON, clearNamespace } from "@/lib/persistence";
import { auth } from "@/providers/auth-registry";
import {
  mockAllUsers, mockCreateUser, mockDeleteUser, mockUpdateUser,
  mockSetImpersonation, mockGetImpersonation, mockResetPasswordTo,
} from "@/providers/auth/MockAuthProvider";
import { logAction, clearLogs as clearAuditLogs } from "@/services/auditLogService";
import { setConfig, getConfig, type ProviderConfig } from "@/services/providerConfigService";
import { isFeatureEnabled, setFeatureFlagOverride, type FeatureFlag } from "@/lib/featureFlags";
import type { Payment, Plan, Role, Subscription, User } from "@/providers/types";
import { notificationService } from "@/services/notificationService";
import {
  deleteRuntimeProject,
  listRuntimeProjects,
} from "@/services/runtimeService";

/* ============================================================
 * Users
 * ============================================================ */

export interface AdminUserRow extends User {
  suspended?: boolean;
  projectCount: number;
}

function suspendedSet(): Set<string> {
  return new Set(readJSON<string[]>("admin", "suspended", []));
}
function saveSuspended(s: Set<string>) { writeJSON("admin", "suspended", Array.from(s)); }

export function listUsers(): AdminUserRow[] {
  const suspended = suspendedSet();
  return mockAllUsers().map((u) => ({
    ...u,
    suspended: suspended.has(u.id),
    projectCount: 0,
  }));
}

export function updateUserRole(userId: string, role: Role) {
  mockUpdateUser(userId, { role });
  logAction("user.role_change", { entityType: "user", entityId: userId, metadata: { role } });
}

export function suspendUser(userId: string) {
  const s = suspendedSet(); s.add(userId); saveSuspended(s);
  logAction("user.suspend", { entityType: "user", entityId: userId });
}
export function reactivateUser(userId: string) {
  const s = suspendedSet(); s.delete(userId); saveSuspended(s);
  logAction("user.reactivate", { entityType: "user", entityId: userId });
}
export function deleteUser(userId: string) {
  mockDeleteUser(userId);
  logAction("user.delete", { entityType: "user", entityId: userId });
}
export function resetUserPassword(userId: string, newPw = "Lumina!2026") {
  mockResetPasswordTo(userId, newPw);
  logAction("user.password_reset", { entityType: "user", entityId: userId });
  return newPw;
}
export function createUser(input: { email: string; name: string; role: Role; password?: string }) {
  const u = mockCreateUser(input);
  logAction("user.create", { entityType: "user", entityId: u.id, metadata: { role: u.role } });
  return u;
}

/* ============================================================
 * Projects
 * ============================================================ */

export async function listAllProjects() {
  return listRuntimeProjects();
}
export async function deleteProject(id: string) {
  await deleteRuntimeProject(
    id,
  );

    logAction(
    "project.delete",
    {
      entityType: "project",
      entityId: id,
    },
  );
}
export function transferProjectOwnership(id: string, newOwnerId: string) {
  logAction("project.transfer.blocked", {
    entityType: "project",
    entityId: id,
    metadata: { newOwnerId },
  });

  throw new Error(
    "Project ownership transfer requires a runtime metadata update endpoint.",
  );
}

/* ============================================================
 * Billing
 * ============================================================ */

function loadSubs(): Subscription[] { return readJSON<Subscription[]>("billing", "subs", []); }
function saveSubs(s: Subscription[]) { writeJSON("billing", "subs", s); }
function loadPayments(): Payment[] { return readJSON<Payment[]>("billing", "payments", []); }
function savePayments(p: Payment[]) { writeJSON("billing", "payments", p); }

export function listSubscriptions() { return loadSubs(); }
export function listPayments() { return loadPayments(); }

export function grantPlan(userId: string, plan: Plan, role: Role) {
  const subs = loadSubs().filter((s) => !(s.userId === userId && s.status === "active"));
  subs.push({
    id: `sub_${Date.now().toString(36)}`, userId, plan, status: "active",
    startedAt: Date.now(), renewsAt: Date.now() + 30 * 86400_000,
  });
  saveSubs(subs);
  mockUpdateUser(userId, { role });
  logAction("billing.grant_plan", { entityType: "user", entityId: userId, metadata: { plan, role } });
}

export function revokePlan(userId: string) {
  const subs = loadSubs().map((s) =>
    s.userId === userId && s.status === "active"
      ? { ...s, status: "canceled" as const, canceledAt: Date.now() }
      : s,
  );
  saveSubs(subs);
  mockUpdateUser(userId, { role: "free" });
  logAction("billing.revoke_plan", { entityType: "user", entityId: userId });
}

export function refundPayment(paymentId: string) {
  const ps = loadPayments().map((p) => p.id === paymentId ? { ...p, status: "refunded" as const } : p);
  savePayments(ps);
  logAction("billing.refund", { entityType: "payment", entityId: paymentId });
}

/* ============================================================
 * Providers
 * ============================================================ */

export function getProviderConfiguration(): ProviderConfig { return getConfig(); }
export function setProviderConfiguration(patch: Partial<ProviderConfig>) {
  setConfig(patch);
  logAction("providers.update", { metadata: patch });
}

/* ============================================================
 * Feature flags
 * ============================================================ */

const KNOWN_FLAGS: FeatureFlag[] = ["transform_to_website", "transform_to_website.real_engine"];

export function listFeatureFlags() {
  return KNOWN_FLAGS.map((f) => ({ flag: f, enabled: isFeatureEnabled(f) }));
}
export function updateFeatureFlag(flag: FeatureFlag, enabled: boolean) {
  setFeatureFlagOverride(flag, enabled);
  logAction("feature_flag.update", { metadata: { flag, enabled } });
}

/* ============================================================
 * Maintenance
 * ============================================================ */

export async function resetAllData() {
  const { resetSeed } = await import("@/lib/seed");
  resetSeed();
}
export async function rerunSeed(): Promise<void> {
  logAction("maintenance.rerun_seed");

  try {
    const { runSeed } = await import("@/lib/seed");

    if (typeof runSeed !== "function") {
      throw new Error("runSeed export is missing");
    }

    await Promise.resolve(runSeed());

    logAction("maintenance.rerun_seed.success");
  } catch (error) {
    console.error(
      "[KoreLumina] Failed to rerun seed",
      error,
    );

    logAction("maintenance.rerun_seed.failed", {
      metadata: {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
    });

    throw error;
  }
}
export function clearNotifications() {
  notificationService.clear?.();
  clearNamespace("notifications");
  logAction("maintenance.clear_notifications");
}
export function clearAuditLog() { clearAuditLogs(); logAction("maintenance.clear_audit_logs"); }

export function exportSnapshot(): string {
  const dump: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const prefix = "korelumina:v1:";
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(prefix)) dump[k] = window.localStorage.getItem(k) ?? "";
    }
  }
  logAction("maintenance.export_snapshot");
  return JSON.stringify({ exportedAt: Date.now(), version: 1, data: dump }, null, 2);
}

export function importSnapshot(json: string) {
  const parsed = JSON.parse(json) as { data: Record<string, string> };
  if (typeof window === "undefined") return;
  Object.entries(parsed.data).forEach(([k, v]) => window.localStorage.setItem(k, v));
  logAction("maintenance.import_snapshot");
  window.location.reload();
}

/* ============================================================
 * Impersonation
 * ============================================================ */

export function impersonateUser(userId: string) {
  mockSetImpersonation(userId);
  logAction("impersonation.start", { entityType: "user", entityId: userId });
  // Force auth subscribers to refresh
  void auth.getUser();
  window.dispatchEvent(new Event("storage"));
}

export function stopImpersonation() {
  const id = mockGetImpersonation();
  mockSetImpersonation(null);
  logAction("impersonation.stop", { entityType: "user", entityId: id ?? undefined });
  window.dispatchEvent(new Event("storage"));
}

export function getImpersonatedUserId() { return mockGetImpersonation(); }
