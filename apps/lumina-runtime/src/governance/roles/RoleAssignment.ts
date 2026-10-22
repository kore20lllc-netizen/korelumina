import fs from "node:fs";
import path from "node:path";

import {
  isNodeTestProcess,
  isolatedTestStorageRoot,
  resolveRepositoryRoot,
} from "../../knowledge-preservation/storage/resolveKnowledgeStorageRoot.js";

/*
 * SEC-1e (ADR-0043 Decision 3): staff roles are assigned by the owner
 * through Runtime, never by the person holding them, and every assignment
 * is a committed governance record.
 *
 * Roles live in Supabase app_metadata, which only the service role can
 * write. Runtime holds the service role key; the browser never does.
 */

export const STAFF_ROLES = ["user", "inhouse-dev", "admin", "super_admin"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

/* Plans are assigned by the payment provider (BILL-1), not by hand. */
export const PLAN_ROLES = ["pro", "business", "enterprise"] as const;

export interface DirectoryUser {
  id: string;
  email: string;
  role: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  appMetadata: Record<string, unknown>;
}

export interface UserDirectory {
  readonly configured: boolean;
  list(): Promise<DirectoryUser[]>;
  setRole(user: DirectoryUser, role: StaffRole): Promise<DirectoryUser>;
}

type Fetch = typeof fetch;

function toDirectoryUser(raw: any): DirectoryUser {
  const appMetadata =
    raw?.app_metadata && typeof raw.app_metadata === "object" ? raw.app_metadata : {};
  return {
    id: String(raw?.id ?? ""),
    email: String(raw?.email ?? ""),
    role: typeof appMetadata.role === "string" ? appMetadata.role : null,
    createdAt: typeof raw?.created_at === "string" ? raw.created_at : null,
    lastSignInAt: typeof raw?.last_sign_in_at === "string" ? raw.last_sign_in_at : null,
    appMetadata,
  };
}

export class SupabaseAdminUserDirectory implements UserDirectory {
  constructor(
    private readonly url: string | undefined,
    private readonly serviceRoleKey: string | undefined,
    private readonly fetchImpl: Fetch = fetch,
  ) {}

  get configured(): boolean {
    return Boolean(this.url && this.serviceRoleKey);
  }

  private headers() {
    return {
      apikey: this.serviceRoleKey as string,
      Authorization: `Bearer ${this.serviceRoleKey}`,
      "Content-Type": "application/json",
    };
  }

  async list(): Promise<DirectoryUser[]> {
    if (!this.configured) throw new Error("user_directory_not_configured");
    const users: DirectoryUser[] = [];
    for (let page = 1; page <= 20; page += 1) {
      const response = await this.fetchImpl(
        `${this.url}/auth/v1/admin/users?page=${page}&per_page=200`,
        { headers: this.headers() },
      );
      if (!response.ok) throw new Error(`user_directory_failed:${response.status}`);
      const body = (await response.json()) as { users?: unknown[] };
      const batch = Array.isArray(body?.users) ? body.users.map(toDirectoryUser) : [];
      users.push(...batch);
      if (batch.length < 200) break;
    }
    return users;
  }

  /* MS-2026-0003: billing reads one person and writes their plan. */
  async get(userId: string): Promise<DirectoryUser | null> {
    if (!this.configured) throw new Error("user_directory_not_configured");
    const response = await this.fetchImpl(
      `${this.url}/auth/v1/admin/users/${encodeURIComponent(userId)}`,
      { headers: this.headers() },
    );
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`user_directory_failed:${response.status}`);
    return toDirectoryUser(await response.json());
  }

  async updateAppMetadata(user: DirectoryUser, patch: Record<string, unknown>): Promise<DirectoryUser> {
    if (!this.configured) throw new Error("user_directory_not_configured");
    const response = await this.fetchImpl(
      `${this.url}/auth/v1/admin/users/${encodeURIComponent(user.id)}`,
      {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify({ app_metadata: { ...user.appMetadata, ...patch } }),
      },
    );
    if (!response.ok) throw new Error(`app_metadata_update_failed:${response.status}`);
    return toDirectoryUser(await response.json());
  }

  async setRole(user: DirectoryUser, role: StaffRole): Promise<DirectoryUser> {
    if (!this.configured) throw new Error("user_directory_not_configured");
    const response = await this.fetchImpl(
      `${this.url}/auth/v1/admin/users/${encodeURIComponent(user.id)}`,
      {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify({ app_metadata: { ...user.appMetadata, role } }),
      },
    );
    if (!response.ok) throw new Error(`role_assignment_failed:${response.status}`);
    return toDirectoryUser(await response.json());
  }
}

export interface RoleAssignmentRecord {
  id: string;
  userId: string;
  email: string;
  fromRole: string | null;
  toRole: StaffRole;
  reason: string;
  assignedBy: string;
  assignedAt: string;
}

export function resolveRoleAssignmentRoot(): string {
  const configured = process.env.KORELUMINA_ROLE_ASSIGNMENT_ROOT?.trim();
  if (configured) return path.resolve(configured);
  if (isNodeTestProcess()) return isolatedTestStorageRoot("role-assignments");
  return path.join(resolveRepositoryRoot(), "runtime", "governance", "role-assignments");
}

export class FileRoleAssignmentLedger {
  constructor(private readonly root: () => string = resolveRoleAssignmentRoot) {}

  record(record: RoleAssignmentRecord): void {
    const root = this.root();
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(
      path.join(root, `${record.assignedAt.replace(/[:.]/g, "-")}-${encodeURIComponent(record.userId)}.json`),
      `${JSON.stringify(record, null, 2)}\n`,
      { flag: "wx" },
    );
  }

  list(): RoleAssignmentRecord[] {
    const root = this.root();
    if (!fs.existsSync(root)) return [];
    return fs
      .readdirSync(root)
      .filter((name) => name.endsWith(".json"))
      .sort()
      .map((name) => JSON.parse(fs.readFileSync(path.join(root, name), "utf8")) as RoleAssignmentRecord);
  }
}

export type AssignRoleResult =
  | { ok: true; user: DirectoryUser; record: RoleAssignmentRecord }
  | { ok: false; status: number; error: string };

export class RoleAssignmentService {
  constructor(
    private readonly directory: UserDirectory,
    private readonly ledger: FileRoleAssignmentLedger,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async assign(input: {
    userId: string;
    role: string;
    reason: string;
    assignedBy: string;
  }): Promise<AssignRoleResult> {
    if ((PLAN_ROLES as readonly string[]).includes(input.role)) {
      return { ok: false, status: 400, error: "plan_roles_are_assigned_by_billing" };
    }
    if (!(STAFF_ROLES as readonly string[]).includes(input.role)) {
      return { ok: false, status: 400, error: "unknown_role" };
    }
    const reason = input.reason.trim();
    if (reason.length < 3) {
      return { ok: false, status: 400, error: "reason_required" };
    }
    if (!this.directory.configured) {
      return { ok: false, status: 503, error: "user_directory_not_configured" };
    }

    const users = await this.directory.list();
    const user = users.find((entry) => entry.id === input.userId);
    if (!user) return { ok: false, status: 404, error: "user_not_found" };

    const role = input.role as StaffRole;
    if (user.role === role) return { ok: false, status: 409, error: "role_unchanged" };

    /* Never leave KoreLumina without a super admin. */
    if (
      user.role === "super_admin" &&
      role !== "super_admin" &&
      users.filter((entry) => entry.role === "super_admin").length <= 1
    ) {
      return { ok: false, status: 409, error: "last_super_admin" };
    }

    const updated = await this.directory.setRole(user, role);
    const assignedAt = this.now().toISOString();
    const record: RoleAssignmentRecord = {
      id: `role-assignment:${assignedAt}:${user.id}`,
      userId: user.id,
      email: user.email,
      fromRole: user.role,
      toRole: role,
      reason,
      assignedBy: input.assignedBy,
      assignedAt,
    };
    this.ledger.record(record);
    return { ok: true, user: updated, record };
  }
}
