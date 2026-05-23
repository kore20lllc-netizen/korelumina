import { readJSON, writeJSON, subscribe, uid } from "@/lib/persistence";
import { auth } from "@/providers/auth-registry";
import { mockGetImpersonation } from "@/providers/auth/MockAuthProvider";

const NS = "audit";

export interface AuditLog {
  id: string;
  timestamp: number;
  actorId: string;
  actorEmail: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

const MAX_LOGS = 2000;

function load(): AuditLog[] { return readJSON<AuditLog[]>(NS, "all", []); }
function save(list: AuditLog[]) { writeJSON(NS, "all", list.slice(0, MAX_LOGS)); }

export function logAction(
  action: string,
  opts: { entityType?: string; entityId?: string; metadata?: Record<string, unknown> } = {},
) {
  // While impersonating, attribute to the *real* signed-in admin, not the target.
  let actorEmail = "anonymous";
  let actorId = "anon";
  try {
    const impId = mockGetImpersonation();
    const session = auth.getSession();
    if (session) {
      actorId = session.userId;
      // We can't easily look up by id w/o circular import; record id and best-effort email.
      const u = auth.getUser();
      if (u && !impId) actorEmail = u.email;
      else actorEmail = impId ? `(admin acting as ${u?.email ?? impId})` : (u?.email ?? actorEmail);
    }
  } catch { /* noop */ }
  const entry: AuditLog = {
    id: uid("log"), timestamp: Date.now(), actorId, actorEmail, action,
    entityType: opts.entityType, entityId: opts.entityId, metadata: opts.metadata,
  };
  save([entry, ...load()]);
}

export function listLogs(limit = 500): AuditLog[] { return load().slice(0, limit); }

export function searchLogs(filter: {
  action?: string; actorId?: string; entityType?: string; since?: number; until?: number; q?: string;
} = {}): AuditLog[] {
  return load().filter((l) => {
    if (filter.action && !l.action.includes(filter.action)) return false;
    if (filter.actorId && l.actorId !== filter.actorId) return false;
    if (filter.entityType && l.entityType !== filter.entityType) return false;
    if (filter.since && l.timestamp < filter.since) return false;
    if (filter.until && l.timestamp > filter.until) return false;
    if (filter.q) {
      const q = filter.q.toLowerCase();
      const hay = `${l.action} ${l.actorEmail} ${l.entityType ?? ""} ${l.entityId ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function clearLogs() { save([]); }
export function onLogsChange(cb: () => void) { return subscribe(NS, cb); }