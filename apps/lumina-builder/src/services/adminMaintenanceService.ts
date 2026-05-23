import { clearNamespace } from "@/lib/persistence";
import { notificationService } from "@/services/notificationService";
import { logAction, clearLogs as clearAuditLogs } from "@/services/auditLogService";

export async function resetAllData(): Promise<void> {
  logAction("maintenance.reset_all");

  const { resetSeed } = await import("@/lib/seed");

  resetSeed();
}

export async function rerunSeed(): Promise<void> {
  logAction("maintenance.rerun_seed");

  const { runSeed } = await import("@/lib/seed");

  await Promise.resolve(runSeed());

  logAction("maintenance.rerun_seed.success");
}

export function clearNotifications(): void {
  notificationService.clear?.();
  clearNamespace("notifications");
  logAction("maintenance.clear_notifications");
}

export function clearAuditLog(): void {
  clearAuditLogs();
  logAction("maintenance.clear_audit_logs");
}
