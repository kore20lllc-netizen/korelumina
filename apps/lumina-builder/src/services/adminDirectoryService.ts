import {
  getRuntimeCallerHeaders,
  RUNTIME_API,
} from "@/services/runtime/client";

/*
 * SEC-1e (ADR-0043 Decision 3): the real user directory and staff role
 * assignment, through Runtime. Runtime holds the Supabase service role key
 * and records every assignment; the browser only asks.
 */

export type StaffRole = "user" | "inhouse-dev" | "admin" | "super_admin";

export const STAFF_ROLES: StaffRole[] = ["user", "inhouse-dev", "admin", "super_admin"];

export interface DirectoryUser {
  id: string;
  email: string;
  role: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
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

const MESSAGES: Record<string, string> = {
  super_admin_required: "Only a signed-in super admin can manage roles.",
  user_directory_not_configured:
    "Runtime has no Supabase service role key (SUPABASE_SERVICE_ROLE_KEY), so it cannot read or change users.",
  plan_roles_are_assigned_by_billing: "Plans are assigned by billing, not by hand.",
  last_super_admin: "KoreLumina must keep at least one super admin.",
  role_unchanged: "That user already has this role.",
  reason_required: "Give a reason; it is kept in the audit record.",
  user_not_found: "That user no longer exists.",
};

function explain(error: unknown, status: number): string {
  const code = typeof error === "string" ? error : `runtime_answered_${status}`;
  return MESSAGES[code] ?? code;
}

export async function listDirectoryUsers(): Promise<{
  users: DirectoryUser[];
  assignments: RoleAssignmentRecord[];
}> {
  const response = await fetch(`${RUNTIME_API}/api/admin/users`, {
    cache: "no-store",
    headers: getRuntimeCallerHeaders(),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.ok !== true) {
    throw new Error(explain(body?.error, response.status));
  }
  return {
    users: Array.isArray(body.users) ? body.users : [],
    assignments: Array.isArray(body.assignments) ? body.assignments : [],
  };
}

export async function assignStaffRole(
  userId: string,
  role: StaffRole,
  reason: string,
): Promise<RoleAssignmentRecord> {
  const response = await fetch(
    `${RUNTIME_API}/api/admin/users/${encodeURIComponent(userId)}/role`,
    {
      method: "POST",
      headers: getRuntimeCallerHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ role, reason }),
    },
  );
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.ok !== true) {
    throw new Error(explain(body?.error, response.status));
  }
  return body.record;
}
