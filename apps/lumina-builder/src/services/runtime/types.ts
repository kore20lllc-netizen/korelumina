import type { LucideIcon } from "lucide-react";

export type HealthStatus = "healthy" | "degraded" | "critical" | "offline";
export type RuntimeState = "starting" | "running" | "idle" | "restarting" | "stopped" | "error";
export type Environment = "production" | "staging" | "preview";
export type EventSeverity = "info" | "warn" | "error" | "success";
export type LogLevel = "debug" | "info" | "warn" | "error";
export type LifecyclePhase = "build" | "boot" | "ready" | "drain" | "stop";
export type RuntimeAction = "restart" | "shutdown" | "start" | "drain" | "rollback";

export interface RuntimeHealth {
  status: HealthStatus;
  /** 0-100 */
  score: number;
  reasons: string[];
}

export interface RuntimeMetrics {
  cpuPct: number;
  memUsedMb: number;
  memTotalMb: number;
  rps: number;
  p95Ms: number;
  errorRatePct: number;
  /** 60 most-recent samples, oldest first. */
  cpuSeries: number[];
  memSeries: number[];
}

export interface RuntimeProject {
  id: string;
  name: string;
  env: Environment;
  region: string;
  version: string;
  state: RuntimeState;
  health: RuntimeHealth;
  startedAt: number;
  uptimeMs: number;
  metrics: RuntimeMetrics;
}

export interface RuntimeEvent {
  id: string;
  projectId: string;
  kind: "deploy" | "restart" | "scale" | "alert" | "health";
  message: string;
  at: number;
  severity: EventSeverity;
}

export interface LifecycleEvent {
  id: string;
  projectId: string;
  phase: LifecyclePhase;
  label: string;
  at: number;
  durationMs?: number;
}

export interface LogEntry {
  id: string;
  projectId: string;
  at: number;
  level: LogLevel;
  source: string;
  message: string;
}

export interface RuntimeOverall {
  health: RuntimeHealth;
  running: number;
  total: number;
  avgCpu: number;
  avgMem: number;
  totalRps: number;
}

export interface RuntimeSnapshot {
  projects: RuntimeProject[];
  events: RuntimeEvent[];
  timeline: LifecycleEvent[];
  logs: LogEntry[];
  overall: RuntimeOverall;
  updatedAt: number;
}

export interface ActionMeta {
  label: string;
  icon: LucideIcon | null;
  destructive?: boolean;
  confirm?: boolean;
}


export interface RuntimeOperationsService {
  getSnapshot(): RuntimeSnapshot;
  subscribe(cb: (s: RuntimeSnapshot) => void): () => void;
  dispatch(action: RuntimeAction, projectId: string, opts?: { version?: string }): Promise<void>;
}