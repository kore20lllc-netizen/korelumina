import type { PreviewTone } from "../../executive/design/executiveDesignPreview";
import type { EventSeverity, HealthStatus, LogLevel, RuntimeState } from "@/services/runtime/types";

/* MS-2026-0011: how Runtime values map onto the Knowledge Operations tones. */

export const HEALTH_TONE: Record<HealthStatus, PreviewTone> = {
  healthy: "healthy",
  degraded: "warning",
  critical: "error",
  offline: "active",
};

export const HEALTH_LABEL: Record<HealthStatus, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  critical: "Critical",
  offline: "Offline",
};

export const STATE_LABEL: Record<RuntimeState, string> = {
  starting: "Starting",
  running: "Running",
  idle: "Idle",
  restarting: "Restarting",
  stopped: "Stopped",
  error: "Error",
};

export const STATE_TONE: Record<RuntimeState, PreviewTone> = {
  starting: "active",
  running: "healthy",
  idle: "active",
  restarting: "warning",
  stopped: "active",
  error: "error",
};

export const EVENT_TONE: Record<EventSeverity, PreviewTone> = {
  info: "active",
  success: "healthy",
  warn: "warning",
  error: "error",
};

export const LOG_LEVELS: readonly LogLevel[] = ["debug", "info", "warn", "error"];

export const LOG_TONE: Record<LogLevel, string> = {
  debug: "text-white/45",
  info: "text-cyan-100/85",
  warn: "text-amber-200",
  error: "text-rose-200",
};

export function duration(ms: number): string {
  if (!ms || ms < 0) return "—";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

export function clock(at: number): string {
  return new Date(at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
