import type {
  Environment,
  HealthStatus,
  LifecycleEvent,
  LogEntry,
  RuntimeAction,
  RuntimeEvent,
  RuntimeMetrics,
  RuntimeOperationsService,
  RuntimeProject,
  RuntimeSnapshot,
  RuntimeState,
  SimulateScenario,
} from "./types";

// Deterministic PRNG so demos look stable but alive.
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const rid = (rand: () => number) => Math.floor(rand() * 1e9).toString(36);

function pushSeries(series: number[], next: number, cap = 60) {
  const out = series.length >= cap ? series.slice(series.length - cap + 1) : series.slice();
  out.push(Math.round(next * 100) / 100);
  return out;
}

function classifyHealth(m: RuntimeMetrics, state: RuntimeState): { status: HealthStatus; score: number; reasons: string[] } {
  const reasons: string[] = [];
  if (state === "stopped") return { status: "offline", score: 0, reasons: ["Process stopped"] };
  if (state === "error") return { status: "critical", score: 12, reasons: ["Runtime error"] };
  let score = 100;
  if (m.cpuPct > 85) { score -= 25; reasons.push(`CPU ${m.cpuPct.toFixed(0)}%`); }
  else if (m.cpuPct > 70) { score -= 10; reasons.push(`CPU elevated ${m.cpuPct.toFixed(0)}%`); }
  const memPct = (m.memUsedMb / m.memTotalMb) * 100;
  if (memPct > 90) { score -= 25; reasons.push(`Memory ${memPct.toFixed(0)}%`); }
  else if (memPct > 75) { score -= 8; reasons.push(`Memory ${memPct.toFixed(0)}%`); }
  if (m.errorRatePct > 3) { score -= 30; reasons.push(`Errors ${m.errorRatePct.toFixed(1)}%`); }
  else if (m.errorRatePct > 0.5) { score -= 10; reasons.push(`Errors ${m.errorRatePct.toFixed(1)}%`); }
  if (m.p95Ms > 800) { score -= 10; reasons.push(`p95 ${m.p95Ms}ms`); }
  score = clamp(score, 0, 100);
  const status: HealthStatus = score >= 80 ? "healthy" : score >= 55 ? "degraded" : "critical";
  return { status, score, reasons };
}

const SEED_PROJECTS: Array<Omit<RuntimeProject, "metrics" | "health" | "uptimeMs">> = [
  { id: "aurora",   name: "Aurora Studio",      env: "production", region: "us-east-1", version: "v4.12.0", state: "running",   startedAt: Date.now() - 1000 * 60 * 60 * 26 },
  { id: "pulse",    name: "Pulse Analytics",    env: "production", region: "eu-west-1", version: "v2.7.3",  state: "running",   startedAt: Date.now() - 1000 * 60 * 90 },
  { id: "helix",    name: "Helix CRM",          env: "staging",    region: "us-west-2", version: "v1.9.0",  state: "idle",      startedAt: Date.now() - 1000 * 60 * 60 * 4 },
  { id: "lumen",    name: "Lumen AI Companion", env: "production", region: "us-east-1", version: "v0.14.2", state: "running",   startedAt: Date.now() - 1000 * 60 * 12 },
  { id: "atlas",    name: "Atlas Ops",          env: "staging",    region: "eu-west-1", version: "v3.0.1",  state: "restarting",startedAt: Date.now() - 1000 * 60 * 2 },
  { id: "nova",     name: "Nova Landing",       env: "preview",    region: "us-east-1", version: "v0.3.0",  state: "running",   startedAt: Date.now() - 1000 * 60 * 60 * 3 },
];

export class MockRuntimeOperationsService implements RuntimeOperationsService {
  private rand = mulberry32(0x4c554d49);
  private projects: RuntimeProject[];
  private events: RuntimeEvent[] = [];
  private timeline: LifecycleEvent[] = [];
  private logs: LogEntry[] = [];
  private listeners = new Set<(s: RuntimeSnapshot) => void>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private shouldFailNext = false;
  private scenario: SimulateScenario = "idle";

  constructor() {
    const r = this.rand;
    this.projects = SEED_PROJECTS.map((p) => {
      const cpu = 20 + r() * 40;
      const memTotal = 2048;
      const memUsed = memTotal * (0.35 + r() * 0.35);
      const metrics: RuntimeMetrics = {
        cpuPct: cpu,
        memUsedMb: memUsed,
        memTotalMb: memTotal,
        rps: Math.round(20 + r() * 180),
        p95Ms: Math.round(120 + r() * 240),
        errorRatePct: Math.round(r() * 60) / 100,
        cpuSeries: Array.from({ length: 60 }, (_, i) => Math.round((cpu + Math.sin(i / 6) * 8 + (r() - 0.5) * 4) * 100) / 100),
        memSeries: Array.from({ length: 60 }, (_, i) => Math.round(((memUsed / memTotal) * 100 + Math.cos(i / 5) * 4 + (r() - 0.5) * 3) * 100) / 100),
      };
      const health = classifyHealth(metrics, p.state);
      return { ...p, metrics, health, uptimeMs: Date.now() - p.startedAt };
    });
    // Seed timeline + events + logs so mount isn't empty.
    for (const p of this.projects) {
      this.timeline.push(
        { id: rid(r), projectId: p.id, phase: "build", label: `Built ${p.version}`, at: p.startedAt - 1000 * 60, durationMs: 42_000 },
        { id: rid(r), projectId: p.id, phase: "boot",  label: "Boot complete",       at: p.startedAt - 1000 * 30, durationMs: 6_400 },
        { id: rid(r), projectId: p.id, phase: "ready", label: "Ready to serve",      at: p.startedAt },
      );
      this.events.push({
        id: rid(r), projectId: p.id, kind: "deploy",
        message: `${p.name} deployed ${p.version} to ${p.env}`,
        at: p.startedAt, severity: "success",
      });
      this.logs.push({
        id: rid(r), projectId: p.id, at: Date.now() - 4000,
        level: "info", source: "runtime", message: `serving on :${3000 + Math.floor(r() * 900)}`,
      });
    }
  }

  private start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), 1500);
  }

  private stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  private tick() {
    const r = this.rand;
    const bias =
      this.scenario === "spike" ? 15 :
      this.scenario === "outage" ? 40 :
      this.scenario === "recover" ? -10 : 0;

    this.projects = this.projects.map((p) => {
      if (p.state === "stopped") return p;
      const jitter = (r() - 0.5) * 6;
      const cpu = clamp(p.metrics.cpuPct + jitter + bias * (r() * 0.6 + 0.4) * (this.scenario === "outage" ? 0.6 : 1), 2, 99);
      const memPct = clamp((p.metrics.memUsedMb / p.metrics.memTotalMb) * 100 + (r() - 0.5) * 3 + bias * 0.3, 10, 98);
      const memUsed = (memPct / 100) * p.metrics.memTotalMb;
      const rps = clamp(p.metrics.rps + Math.round((r() - 0.5) * 20 + bias), 0, 2000);
      const p95 = clamp(Math.round(p.metrics.p95Ms + (r() - 0.5) * 30 + bias * 3), 40, 4000);
      const errRate = clamp(Math.round((p.metrics.errorRatePct + (r() - 0.5) * 0.4 + (this.scenario === "outage" ? 1.5 : this.scenario === "recover" ? -0.4 : 0)) * 100) / 100, 0, 40);
      const metrics: RuntimeMetrics = {
        cpuPct: cpu,
        memUsedMb: memUsed,
        memTotalMb: p.metrics.memTotalMb,
        rps,
        p95Ms: p95,
        errorRatePct: errRate,
        cpuSeries: pushSeries(p.metrics.cpuSeries, cpu),
        memSeries: pushSeries(p.metrics.memSeries, memPct),
      };
      let state = p.state;
      if (p.state === "restarting" && r() > 0.6) state = "running";
      const prevStatus = p.health.status;
      const health = classifyHealth(metrics, state);
      if (health.status !== prevStatus) {
      this.events = [
          {
            id: rid(r), projectId: p.id, kind: "health",
            message: `${p.name} health ${prevStatus} → ${health.status}`,
            at: Date.now(),
            severity: health.status === "healthy" ? "success" : health.status === "degraded" ? "warn" : "error",
          },
          ...this.events,
        ].slice(0, 80) as RuntimeEvent[];
      }
      return { ...p, state, metrics, health, uptimeMs: Date.now() - p.startedAt };
    });

    // Occasional log line.
    if (r() > 0.4) {
      const p = this.projects[Math.floor(r() * this.projects.length)];
      const level = r() > 0.92 ? "error" : r() > 0.75 ? "warn" : r() > 0.35 ? "info" : "debug";
      const source = ["runtime", "http", "worker", "db"][Math.floor(r() * 4)];
      const messages: Record<string, string[]> = {
        runtime: ["heartbeat ok", "gc pause 6ms", "queue drained", "scaling steady"],
        http:    ["GET /api/health 200", "POST /api/tasks 201", "GET /api/users 200 42ms", "GET /assets/app.js 304"],
        worker:  ["job:index-refresh done", "job:email-digest queued", "job:cleanup skipped"],
        db:      ["conn pool 12/32", "slow query 210ms", "vacuum complete"],
      };
      const msg = messages[source][Math.floor(r() * messages[source].length)];
      this.logs = [{ id: rid(r), projectId: p.id, at: Date.now(), level: level as LogEntry["level"], source, message: msg }, ...this.logs].slice(0, 200);
    }

    this.emit();
  }

  private emit() {
    const snap = this.getSnapshot();
    this.listeners.forEach((cb) => cb(snap));
  }

  getSnapshot(): RuntimeSnapshot {
    const running = this.projects.filter((p) => p.state === "running").length;
    const total = this.projects.length;
    const avgCpu = total ? this.projects.reduce((s, p) => s + p.metrics.cpuPct, 0) / total : 0;
    const avgMem = total ? this.projects.reduce((s, p) => s + (p.metrics.memUsedMb / p.metrics.memTotalMb) * 100, 0) / total : 0;
    const totalRps = this.projects.reduce((s, p) => s + p.metrics.rps, 0);
    const worst = this.projects.reduce<HealthStatus>((acc, p) => {
      const order: HealthStatus[] = ["healthy", "degraded", "critical", "offline"];
      return order.indexOf(p.health.status) > order.indexOf(acc) ? p.health.status : acc;
    }, "healthy");
    const overallScore = total ? Math.round(this.projects.reduce((s, p) => s + p.health.score, 0) / total) : 100;
    return {
      projects: this.projects,
      events: this.events,
      timeline: this.timeline,
      logs: this.logs,
      overall: {
        health: { status: worst, score: overallScore, reasons: [] },
        running, total, avgCpu, avgMem, totalRps,
      },
      updatedAt: Date.now(),
    };
  }

  subscribe(cb: (s: RuntimeSnapshot) => void) {
    this.listeners.add(cb);
    if (this.listeners.size === 1) this.start();
    // Push initial snapshot on next microtask so React callers can attach state first.
    Promise.resolve().then(() => cb(this.getSnapshot()));
    return () => {
      this.listeners.delete(cb);
      if (this.listeners.size === 0) this.stop();
    };
  }

  async dispatch(action: RuntimeAction, projectId: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 600));
    if (this.shouldFailNext) {
      this.shouldFailNext = false;
      throw new Error(`Failed to ${action} ${projectId}`);
    }
    const r = this.rand;
    this.projects = this.projects.map((p) => {
      if (p.id !== projectId) return p;
      let state: RuntimeState = p.state;
      let startedAt = p.startedAt;
      if (action === "restart") { state = "restarting"; startedAt = Date.now(); }
      else if (action === "shutdown") { state = "stopped"; }
      else if (action === "start") { state = "starting"; startedAt = Date.now(); }
      else if (action === "drain") { state = "idle"; }
      else if (action === "rollback") { state = "restarting"; startedAt = Date.now(); }
      return { ...p, state, startedAt, health: classifyHealth(p.metrics, state) };
    });
    const proj = this.projects.find((p) => p.id === projectId);
    if (proj) {
      this.events = [{
        id: rid(r), projectId, kind: action === "restart" || action === "start" ? "restart" : action === "shutdown" ? "alert" : "scale",
        message: `${proj.name}: ${action} dispatched`,
        at: Date.now(),
        severity: action === "shutdown" ? "warn" : "info",
      } as RuntimeEvent, ...this.events].slice(0, 80);
      this.timeline = [{
        id: rid(r), projectId, phase: action === "shutdown" ? "stop" : action === "drain" ? "drain" : "boot",
        label: `${action} requested`, at: Date.now(),
      } as LifecycleEvent, ...this.timeline].slice(0, 100);
    }
    this.emit();
  }

  simulate(scenario: SimulateScenario) {
    this.scenario = scenario;
  }

  failNext() {
    this.shouldFailNext = true;
  }
}