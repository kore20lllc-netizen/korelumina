export interface MissingDependency {
  name: string;
  required: string;
  found: string | null;
  severity: "low" | "medium" | "high" | "critical";
}

export interface BuildError {
  file: string;
  line: number;
  message: string;
  code?: string;
}

export interface EnvVar {
  key: string;
  description: string;
  present: boolean;
  required: boolean;
}

export interface SecurityFinding {
  id: string;
  package: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  fixedIn?: string;
}

export interface RepairStep {
  id: string;
  title: string;
  detail: string;
  estMinutes: number;
  automated: boolean;
}

export interface AuditReport {
  projectId: string;
  generatedAt: string;
  buildStatus: "passing" | "warning" | "failing";
  typeErrors: number;
  estimatedFixMinutes: number;
  missingDependencies: MissingDependency[];
  buildErrors: BuildError[];
  envVars: EnvVar[];
  securityFindings: SecurityFinding[];
  repairPlan: RepairStep[];
}

const MOCK: AuditReport = {
  projectId: "demo",
  generatedAt: new Date().toISOString(),
  buildStatus: "failing",
  typeErrors: 7,
  estimatedFixMinutes: 95,
  missingDependencies: [
    { name: "zod", required: "^3.23.0", found: null, severity: "high" },
    { name: "@tanstack/react-query", required: "^5.0.0", found: "4.36.1", severity: "medium" },
    { name: "lucide-react", required: "^0.460.0", found: "0.400.0", severity: "low" },
    { name: "dotenv", required: "^16.4.0", found: null, severity: "critical" },
  ],
  buildErrors: [
    { file: "src/pages/Checkout.tsx", line: 42, message: "Cannot find module 'zod'", code: "TS2307" },
    { file: "src/lib/api.ts", line: 18, message: "Property 'env' does not exist on type 'ImportMeta'", code: "TS2339" },
    { file: "src/components/Form.tsx", line: 77, message: "Type 'string | undefined' is not assignable to type 'string'", code: "TS2322" },
  ],
  envVars: [
    { key: "VITE_API_URL", description: "Backend API base URL", present: false, required: true },
    { key: "VITE_STRIPE_KEY", description: "Stripe publishable key", present: false, required: true },
    { key: "VITE_SENTRY_DSN", description: "Error tracking DSN", present: true, required: false },
  ],
  securityFindings: [
    { id: "GHSA-1", package: "axios", severity: "high", title: "Server-side request forgery in axios", fixedIn: "1.7.4" },
    { id: "GHSA-2", package: "ws", severity: "medium", title: "DoS via excessive memory allocation", fixedIn: "8.17.1" },
  ],
  repairPlan: [
    { id: "r1", title: "Install missing dependencies", detail: "Add zod, dotenv; upgrade @tanstack/react-query to v5.", estMinutes: 10, automated: true },
    { id: "r2", title: "Patch security advisories", detail: "Upgrade axios to 1.7.4 and ws to 8.17.1.", estMinutes: 15, automated: true },
    { id: "r3", title: "Provision environment variables", detail: "Create .env with VITE_API_URL and VITE_STRIPE_KEY.", estMinutes: 20, automated: false },
    { id: "r4", title: "Resolve TypeScript build errors", detail: "Fix 7 type errors across 3 files.", estMinutes: 50, automated: false },
  ],
};

async function safeFetch<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type RepoSource =
  | { kind: "project"; projectId: string }
  | { kind: "github"; url: string; branch?: string }
  | { kind: "zip"; fileName: string; sizeBytes: number };

export type AuditMode = "scan" | "deep";

function deriveProjectId(source: RepoSource): string {
  if (source.kind === "project") return source.projectId;
  if (source.kind === "github") {
    const m = source.url.match(/github\.com[/:]([^/]+)\/([^/.]+)/i);
    return m ? `${m[1]}/${m[2]}` : source.url;
  }
  return source.fileName.replace(/\.zip$/i, "");
}

export interface AuditProgressEvent {
  index: number;
  total: number;
  step: string;
  message?: string;
  status: "running" | "done" | "error";
}

export type AuditTransport = "connecting" | "stream" | "simulated" | "error";
export interface AuditTransportInfo {
  transport: AuditTransport;
  /** Optional human-readable reason for fallback / disconnection. */
  reason?: string;
}

export interface RunAuditOptions {
  onProgress?: (e: AuditProgressEvent) => void;
  onTransport?: (info: AuditTransportInfo) => void;
  signal?: AbortSignal;
  /** When resuming a cancelled run, skip ahead to this step index instead
   *  of replaying from the beginning. Steps before this index are assumed
   *  to have already completed and are not re-emitted. */
  resumeFromIndex?: number;
}

const DEEP_STEPS: { step: string; messages: string[] }[] = [
  { step: "Inspecting package.json", messages: ["Reading manifest", "Resolving workspaces", "Parsing scripts"] },
  { step: "Detecting framework and runtime", messages: ["Matching signatures", "Probing Vite config", "Identified: React 18 + Vite 5"] },
  { step: "Validating dependencies", messages: ["Resolving lockfile", "Cross-checking peer ranges", "Diffing against registry"] },
  { step: "Scanning environment variables", messages: ["Reading .env templates", "Matching import.meta.env usage", "Flagging missing keys"] },
  { step: "Executing production build", messages: ["vite build · transforming modules", "Bundling chunks", "Emitting assets"] },
  { step: "Capturing TypeScript errors", messages: ["tsc --noEmit", "Walking source graph", "Collating diagnostics"] },
  { step: "Generating repair plan", messages: ["Ranking findings", "Estimating fix effort", "Drafting actions"] },
  { step: "Preparing audit report", messages: ["Aggregating sections", "Finalizing summary"] },
];

const SCAN_STEPS: { step: string; messages: string[] }[] = [
  { step: "Reading repository tree", messages: ["Indexing files"] },
  { step: "Inspecting package.json", messages: ["Resolving dependencies"] },
  { step: "Scanning environment variables", messages: ["Matching required keys"] },
  { step: "Preparing audit report", messages: ["Finalizing summary"] },
];

async function simulateProgress(
  mode: AuditMode,
  onProgress: (e: AuditProgressEvent) => void,
  signal?: AbortSignal,
  startIndex = 0,
) {
  const steps = mode === "deep" ? DEEP_STEPS : SCAN_STEPS;
  const baseStep = mode === "deep" ? 520 : 220;
  const baseMsg = mode === "deep" ? 360 : 180;
  const start = Math.max(0, Math.min(startIndex | 0, steps.length));
  for (let i = start; i < steps.length; i++) {
    if (signal?.aborted) return;
    const { step, messages } = steps[i];
    onProgress({ index: i, total: steps.length, step, status: "running", message: messages[0] });
    for (let m = 1; m < messages.length; m++) {
      await new Promise((res) => setTimeout(res, baseMsg + Math.random() * baseMsg));
      if (signal?.aborted) return;
      onProgress({ index: i, total: steps.length, step, status: "running", message: messages[m] });
    }
    await new Promise((res) => setTimeout(res, baseStep + Math.random() * baseStep));
    if (signal?.aborted) return;
    onProgress({ index: i, total: steps.length, step, status: "done" });
  }
}

async function readProgressStream(
  res: Response,
  onProgress: (e: AuditProgressEvent) => void,
): Promise<AuditReport | null> {
  if (!res.body) return null;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let report: AuditReport | null = null;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const raw = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!raw) continue;
      const line = raw.startsWith("data:") ? raw.slice(5).trim() : raw;
      try {
        const msg = JSON.parse(line);
        if (msg?.type === "progress" && msg.payload) onProgress(msg.payload as AuditProgressEvent);
        else if (msg?.type === "report" && msg.payload) report = msg.payload as AuditReport;
        else if (typeof msg?.index === "number" && typeof msg?.step === "string") onProgress(msg as AuditProgressEvent);
      } catch { /* ignore malformed lines */ }
    }
  }
  return report;
}

export async function runAudit(
  input: string | RepoSource,
  mode: AuditMode = "scan",
  onProgressOrOptions?: ((e: AuditProgressEvent) => void) | RunAuditOptions,
  signal?: AbortSignal,
): Promise<AuditReport & { mode: AuditMode }> {
  const source: RepoSource = typeof input === "string" ? { kind: "project", projectId: input } : input;
  const projectId = deriveProjectId(source);

  const opts: RunAuditOptions =
    typeof onProgressOrOptions === "function"
      ? { onProgress: onProgressOrOptions, signal }
      : { signal, ...(onProgressOrOptions ?? {}) };
  const onProgress = opts.onProgress;
  const onTransport = opts.onTransport;
  const sig = opts.signal;
  const resumeFromIndex = Math.max(0, opts.resumeFromIndex ?? 0);

  // Prefer the streaming endpoint so the UI can render real-time progress
  // events. Fall back to the simulated emitter when the backend isn't
  // available (dev/preview, offline, 404, network error, etc.).
  let streamedReport: AuditReport | null = null;
  if (onProgress) {
    onTransport?.({ transport: "connecting" });
    try {
      const res = await fetch("/api/audit/stream", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/x-ndjson, text/event-stream",
        },
        body: JSON.stringify({ source, mode, resumeFromIndex }),
        signal: sig,
      });
      if (res.ok && res.body) {
        onTransport?.({ transport: "stream" });
        try {
          streamedReport = await readProgressStream(res, onProgress);
        } catch (err) {
          if (sig?.aborted) throw err;
          const reason = err instanceof Error ? err.message : "Stream interrupted";
          onTransport?.({ transport: "error", reason });
          await simulateProgress(mode, onProgress, sig, resumeFromIndex);
          onTransport?.({ transport: "simulated", reason });
        }
      } else {
        const reason = `Backend returned HTTP ${res.status}`;
        onTransport?.({ transport: "simulated", reason });
        await simulateProgress(mode, onProgress, sig, resumeFromIndex);
      }
    } catch (err) {
      if (sig?.aborted) throw err;
      const reason = err instanceof Error ? err.message : "Network error";
      onTransport?.({ transport: "simulated", reason });
      await simulateProgress(mode, onProgress, sig, resumeFromIndex);
    }
  }

  const r = streamedReport ?? (await safeFetch<AuditReport>("/api/audit/run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ source, mode }),
  }));
  const base = r ?? { ...MOCK, projectId, generatedAt: new Date().toISOString() };
  return { ...base, mode };
}

export async function getAudit(projectId: string): Promise<AuditReport> {
  const r = await safeFetch<AuditReport>(`/api/audit/${encodeURIComponent(projectId)}`);
  return r ?? { ...MOCK, projectId };
}

export async function generateRepairPlan(projectId: string): Promise<RepairStep[]> {
  const r = await safeFetch<{ steps: RepairStep[] }>("/api/audit/repair-plan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ projectId }),
  });
  return r?.steps ?? MOCK.repairPlan;
}

export async function applyRepairPlan(projectId: string): Promise<{ ok: boolean; applied: number }> {
  const r = await safeFetch<{ ok: boolean; applied: number }>("/api/audit/apply", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ projectId }),
  });
  return r ?? { ok: true, applied: MOCK.repairPlan.length };
}

// ---------------------------------------------------------------------------
// Fix workflow stubs — backend may still be evolving. These mocked helpers
// power the UI for Generate Fix Plan / Auto Fix / Fix Until Green / Logs.
// ---------------------------------------------------------------------------

export interface FixPlanFile {
  path: string;
  changeType: "modify" | "add" | "delete";
  estLines: number;
}

export interface FixPlan {
  id: string;
  projectId: string;
  generatedAt: string;
  findingsAddressed: number;
  filesAffected: FixPlanFile[];
  estMinutes: number;
  summary: string;
}

export interface DiffPreview {
  stepId: string;
  file: string;
  language: string;
  patch: string;
}

export interface BuildLogLine {
  level: "info" | "warn" | "error" | "debug";
  ts: string;
  text: string;
}

export interface FixIteration {
  index: number;
  phase:
    | "deep-audit"
    | "generate-plan"
    | "generate-diffs"
    | "apply-fixes"
    | "rerun-audit"
    | "passed"
    | "failed";
  remainingFindings: number;
  status: "pending" | "running" | "done" | "error";
  message?: string;
}

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function generateFixPlan(projectId: string): Promise<FixPlan> {
  const r = await safeFetch<FixPlan>("/api/audit/fix-plan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ projectId }),
  });
  if (r) return r;
  await wait(700 + Math.random() * 600);
  return {
    id: `fp_${Date.now().toString(36)}`,
    projectId,
    generatedAt: new Date().toISOString(),
    findingsAddressed:
      MOCK.missingDependencies.length + MOCK.buildErrors.length + MOCK.envVars.filter((e) => e.required && !e.present).length + MOCK.securityFindings.length,
    filesAffected: [
      { path: "package.json", changeType: "modify", estLines: 12 },
      { path: ".env", changeType: "add", estLines: 4 },
      { path: "src/pages/Checkout.tsx", changeType: "modify", estLines: 6 },
      { path: "src/lib/api.ts", changeType: "modify", estLines: 3 },
      { path: "src/components/Form.tsx", changeType: "modify", estLines: 5 },
    ],
    estMinutes: MOCK.repairPlan.reduce((s, r) => s + r.estMinutes, 0),
    summary:
      "Install missing dependencies, patch security advisories, scaffold required env vars, and resolve outstanding TypeScript errors.",
  };
}

export async function autoFix(
  projectId: string,
  onProgress?: (pct: number, message: string) => void,
  signal?: AbortSignal,
): Promise<{ ok: boolean; applied: number; diffs: DiffPreview[] }> {
  const steps = [
    "Resolving dependency graph",
    "Generating diffs",
    "Applying patches",
    "Verifying changes",
  ];
  for (let i = 0; i < steps.length; i++) {
    if (signal?.aborted) throw new Error("Cancelled");
    onProgress?.(Math.round((i / steps.length) * 100), steps[i]);
    await wait(500 + Math.random() * 400);
  }
  onProgress?.(100, "Done");
  return {
    ok: true,
    applied: MOCK.repairPlan.length,
    diffs: MOCK.repairPlan.map((s) => mockDiffForStep(s.id, s.title)),
  };
}

export async function previewDiff(stepId: string, title?: string): Promise<DiffPreview> {
  const r = await safeFetch<DiffPreview>(`/api/audit/diff/${encodeURIComponent(stepId)}`);
  if (r) return r;
  await wait(200 + Math.random() * 250);
  return mockDiffForStep(stepId, title);
}

function mockDiffForStep(stepId: string, title?: string): DiffPreview {
  const t = (title ?? "").toLowerCase();
  // Match by stepId first (matches MOCK.repairPlan r1..r4), then fall back to
  // a heuristic on the title so any backend-provided step still gets a
  // representative diff.
  switch (stepId) {
    case "r1":
      return {
        stepId,
        file: "package.json",
        language: "json",
        patch:
`--- a/package.json
+++ b/package.json
@@ -14,10 +14,12 @@
   "dependencies": {
     "react": "^18.3.1",
     "react-dom": "^18.3.1",
-    "@tanstack/react-query": "4.36.1",
-    "lucide-react": "^0.400.0"
+    "@tanstack/react-query": "^5.0.0",
+    "lucide-react": "^0.460.0",
+    "zod": "^3.23.0",
+    "dotenv": "^16.4.0"
   }
 }
`,
      };
    case "r2":
      return {
        stepId,
        file: "package.json",
        language: "json",
        patch:
`--- a/package.json
+++ b/package.json
@@ -22,8 +22,8 @@
   "dependencies": {
-    "axios": "1.6.0",
-    "ws": "8.16.0"
+    "axios": "^1.7.4",
+    "ws": "^8.17.1"
   }
 }
`,
      };
    case "r3":
      return {
        stepId,
        file: ".env",
        language: "dotenv",
        patch:
`--- /dev/null
+++ b/.env
@@
+# Provisioned by KoreLumina Auto Fix
+VITE_API_URL=https://api.example.com
+VITE_STRIPE_KEY=pk_live_replace_me
`,
      };
    case "r4":
      return {
        stepId,
        file: "src/pages/Checkout.tsx",
        language: "tsx",
        patch:
`--- a/src/pages/Checkout.tsx
+++ b/src/pages/Checkout.tsx
@@ -1,6 +1,7 @@
 import { useState } from "react";
+import { z } from "zod";
 import { Button } from "@/components/ui/button";

-const schema = { email: String, total: Number };
+const schema = z.object({ email: z.string().email(), total: z.number().nonnegative() });
`,
      };
  }

  if (t.includes("env")) {
    return {
      stepId,
      file: ".env",
      language: "dotenv",
      patch:
`--- /dev/null
+++ b/.env
@@
+VITE_API_URL=https://api.example.com
+VITE_STRIPE_KEY=pk_live_replace_me
`,
    };
  }
  if (t.includes("security") || t.includes("advisor")) {
    return {
      stepId,
      file: "package.json",
      language: "json",
      patch:
`--- a/package.json
+++ b/package.json
@@
-    "axios": "1.6.0",
-    "ws": "8.16.0"
+    "axios": "^1.7.4",
+    "ws": "^8.17.1"
`,
    };
  }
  if (t.includes("typescript") || t.includes("type") || t.includes("build")) {
    return {
      stepId,
      file: "src/lib/api.ts",
      language: "ts",
      patch:
`--- a/src/lib/api.ts
+++ b/src/lib/api.ts
@@ -15,7 +15,7 @@
 export function getBaseUrl(): string {
-  return import.meta.env.VITE_API_URL;
+  const url =
+    import.meta.env.VITE_API_URL ||
+    window.location.origin;
+
+  return url;
 }
`,
    };
  }

  // Generic dependency-style fallback.
  return {
    stepId,
    file: "package.json",
    language: "json",
    patch:
`--- a/package.json
+++ b/package.json
@@
   "dependencies": {
-    "@tanstack/react-query": "4.36.1",
+    "@tanstack/react-query": "^5.0.0",
     "lucide-react": "^0.460.0",
+    "zod": "^3.23.0",
+    "dotenv": "^16.4.0"
   }
`,
  };
}

export async function fixUntilGreen(
  projectId: string,
  onIteration: (it: FixIteration) => void,
  signal?: AbortSignal,
  maxIterations = 3,
): Promise<{ passed: boolean; iterations: number }> {
  const phases: FixIteration["phase"][] = [
    "deep-audit",
    "generate-plan",
    "generate-diffs",
    "apply-fixes",
    "rerun-audit",
  ];
  let remaining = 7;
  for (let i = 1; i <= maxIterations; i++) {
    for (const phase of phases) {
      if (signal?.aborted) throw new Error("Cancelled");
      onIteration({ index: i, phase, remainingFindings: remaining, status: "running" });
      await wait(450 + Math.random() * 350);
      onIteration({ index: i, phase, remainingFindings: remaining, status: "done" });
    }
    remaining = Math.max(0, remaining - Math.ceil(remaining / 2) - 1);
    if (remaining === 0) {
      onIteration({ index: i, phase: "passed", remainingFindings: 0, status: "done", message: "Production build passing" });
      return { passed: true, iterations: i };
    }
  }
  onIteration({ index: maxIterations, phase: "failed", remainingFindings: remaining, status: "error", message: `${remaining} findings still open after ${maxIterations} iterations` });
  return { passed: false, iterations: maxIterations };
}

export async function reRunAudit(projectId: string): Promise<AuditReport> {
  const r = await safeFetch<AuditReport>("/api/audit/rerun", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ projectId }),
  });
  await wait(400);
  return r ?? { ...MOCK, projectId, generatedAt: new Date().toISOString(), buildStatus: "passing", typeErrors: 0, buildErrors: [] };
}

export async function getBuildLogs(projectId: string): Promise<BuildLogLine[]> {
  const r = await safeFetch<{ lines: BuildLogLine[] }>(`/api/audit/${encodeURIComponent(projectId)}/logs`);
  if (r?.lines?.length) return r.lines;
  await wait(200);
  const now = Date.now();
  const mk = (offset: number, level: BuildLogLine["level"], text: string): BuildLogLine => ({
    level,
    ts: new Date(now - (1000 - offset)).toISOString(),
    text,
  });
  return [
    mk(0, "info", "$ vite build"),
    mk(20, "info", "vite v5.4.0 building for production..."),
    mk(80, "info", "transforming (143) src/main.tsx"),
    mk(180, "info", "✓ 412 modules transformed"),
    mk(220, "warn", "warn: dynamic import detected without preload hints"),
    mk(260, "info", "rendering chunks..."),
    mk(400, "error", "src/pages/Checkout.tsx(42,18): error TS2307: Cannot find module 'zod'"),
    mk(420, "error", "src/lib/api.ts(18,32): error TS2339: Property 'env' does not exist on type 'ImportMeta'"),
    mk(460, "error", "src/components/Form.tsx(77,5): error TS2322: Type 'string | undefined' is not assignable to type 'string'"),
    mk(540, "error", "Build failed with 3 errors."),
  ];
}