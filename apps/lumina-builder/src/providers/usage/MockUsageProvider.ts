import { readJSON, writeJSON, subscribe } from "@/lib/persistence";
import type { Role, UsageProvider, UsageSnapshot } from "@/providers/types";
import { auth } from "@/providers/auth-registry";

const NS = "usage";

interface UsageRow { aiExecutions: number; deployments: number; transformations: number; projects: number; audits: number }

const ZERO: UsageRow = { aiExecutions: 0, deployments: 0, transformations: 0, projects: 0, audits: 0 };

function load(userId: string): UsageRow { return readJSON<UsageRow>(NS, userId, ZERO); }
function save(userId: string, row: UsageRow) { writeJSON(NS, userId, row); }

function limitsFor(role: Role): Pick<UsageSnapshot, "aiLimit" | "projectLimit"> {
  if (role === "free") return { aiLimit: 5, projectLimit: 1 };
  return { aiLimit: Number.POSITIVE_INFINITY, projectLimit: Number.POSITIVE_INFINITY };
}

export class MockUsageProvider implements UsageProvider {
  snapshot(userId: string): UsageSnapshot {
    const row = load(userId);
    const role = auth.getUser()?.role ?? "free";
    const { aiLimit, projectLimit } = limitsFor(role);
    return { plan: role, aiExecutions: row.aiExecutions, aiLimit, projects: row.projects, projectLimit, deployments: row.deployments, transformations: row.transformations, audits: row.audits ?? 0 };
  }
  recordAIExecution(userId: string) { const r = load(userId); save(userId, { ...r, aiExecutions: r.aiExecutions + 1 }); }
  recordDeployment(userId: string) { const r = load(userId); save(userId, { ...r, deployments: r.deployments + 1 }); }
  recordTransformation(userId: string) { const r = load(userId); save(userId, { ...r, transformations: r.transformations + 1 }); }
  recordProjectCreated(userId: string) { const r = load(userId); save(userId, { ...r, projects: r.projects + 1 }); }
  recordAudit(userId: string) { const r = load(userId); save(userId, { ...r, audits: (r.audits ?? 0) + 1 }); }
  reset(userId: string) { save(userId, ZERO); }
  onChange(cb: () => void) { return subscribe(NS, cb); }
}