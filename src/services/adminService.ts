import { readJSON, writeJSON, clearNamespace } from "@/lib/persistence";
import { auth } from "@/providers/registry";
import {
  mockAllUsers, mockCreateUser, mockDeleteUser, mockUpdateUser,
  mockSetImpersonation, mockGetImpersonation, mockResetPasswordTo,
} from "@/providers/auth/MockAuthProvider";
import { projectRepository } from "@/services/projectRepository";
import { logAction, clearLogs as clearAuditLogs } from "@/services/auditLogService";
import { setConfig, getConfig, type ProviderConfig } from "@/services/providerConfigService";
import { isFeatureEnabled, setFeatureFlagOverride, type FeatureFlag } from "@/lib/featureFlags";
import type { Payment, Plan, Role, Subscription, User } from "@/providers/types";
import { resetSeed } from "@/lib/seed";
import { notificationService } from "@/services/notificationService";

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
  const projects = projectRepository.list();
  return mockAllUsers().map((u) => ({
    ...u,
    suspended: suspended.has(u.id),
    projectCount: projects.filter((p) => p.ownerId === u.id).length,
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

export function listAllProjects() { return projectRepository.list(); }
export function deleteProject(id: string) {
  projectRepository.remove(id);
  logAction("project.delete", { entityType: "project", entityId: id });
}
export function transferProjectOwnership(id: string, newOwnerId: string) {
  projectRepository.update(id, { ownerId: newOwnerId });
  logAction("project.transfer", { entityType: "project", entityId: id, metadata: { newOwnerId } });
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

export function resetAllData() {
  logAction("maintenance.reset_all");
  resetSeed();
}
export function rerunSeed() {
  logAction("maintenance.rerun_seed");
  // resetSeed reloads after wiping; for a soft re-seed without wiping data,
  // delegate to runSeed dynamically.
  import("@/lib/seed").then((m) => m.runSeed());
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