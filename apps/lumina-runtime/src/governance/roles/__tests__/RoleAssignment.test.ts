import assert from "node:assert/strict";
import test from "node:test";

import {
  FileRoleAssignmentLedger,
  RoleAssignmentService,
  SupabaseAdminUserDirectory,
  type DirectoryUser,
  type StaffRole,
  type UserDirectory,
} from "../RoleAssignment.js";

/* SEC-1e (ADR-0043 Decision 3): owner-assigned staff roles, always recorded. */

function directory(users: DirectoryUser[], configured = true) {
  const calls: Array<{ id: string; role: StaffRole }> = [];
  const fake: UserDirectory & { calls: typeof calls } = {
    configured,
    calls,
    async list() {
      return users.map((user) => ({ ...user }));
    },
    async setRole(user, role) {
      calls.push({ id: user.id, role });
      return { ...user, role, appMetadata: { ...user.appMetadata, role } };
    },
  };
  return fake;
}

const owner: DirectoryUser = { id: "usr_owner", email: "owner@korelumina.test", role: "super_admin", createdAt: null, lastSignInAt: null, appMetadata: { provider: "email", role: "super_admin" } };
const dev: DirectoryUser = { id: "usr_dev", email: "dev@korelumina.test", role: null, createdAt: null, lastSignInAt: null, appMetadata: { provider: "email" } };

function service(users: DirectoryUser[], configured = true) {
  const dir = directory(users, configured);
  const ledger = new FileRoleAssignmentLedger();
  return { dir, ledger, roles: new RoleAssignmentService(dir, ledger, () => new Date("2026-10-19T21:00:00.000Z")) };
}

test("the owner assigns a staff role and it is recorded", async () => {
  const { dir, ledger, roles } = service([owner, dev]);
  const before = ledger.list().length;
  const result = await roles.assign({ userId: "usr_dev", role: "inhouse-dev", reason: "Joins engineering", assignedBy: "usr_owner" });
  assert.equal(result.ok, true);
  assert.deepEqual(dir.calls, [{ id: "usr_dev", role: "inhouse-dev" }]);
  const records = ledger.list();
  assert.equal(records.length, before + 1);
  assert.deepEqual(
    { from: records.at(-1)?.fromRole, to: records.at(-1)?.toRole, by: records.at(-1)?.assignedBy, why: records.at(-1)?.reason },
    { from: null, to: "inhouse-dev", by: "usr_owner", why: "Joins engineering" },
  );
});

for (const [name, input, error, status] of [
  ["a plan role", { role: "pro" }, "plan_roles_are_assigned_by_billing", 400],
  ["an unknown role", { role: "god" }, "unknown_role", 400],
  ["no reason", { reason: " " }, "reason_required", 400],
  ["an unknown user", { userId: "usr_ghost" }, "user_not_found", 404],
  ["no change", { userId: "usr_owner", role: "super_admin" }, "role_unchanged", 409],
  ["removing the last super admin", { userId: "usr_owner", role: "admin" }, "last_super_admin", 409],
] as const) {
  test(`refuses ${name} and records nothing`, async () => {
    const { dir, ledger, roles } = service([owner, dev]);
    const before = ledger.list().length;
    const result = await roles.assign({ ...{ userId: "usr_dev", role: "admin", reason: "Promotion", assignedBy: "usr_owner" }, ...input });
    assert.deepEqual(result, { ok: false, status, error });
    assert.equal(dir.calls.length, 0);
    assert.equal(ledger.list().length, before);
  });
}

test("without the service role key nothing can be assigned", async () => {
  const { roles } = service([owner, dev], false);
  const result = await roles.assign({ userId: "usr_dev", role: "admin", reason: "Promotion", assignedBy: "usr_owner" });
  assert.deepEqual(result, { ok: false, status: 503, error: "user_directory_not_configured" });
});

test("the Supabase directory keeps existing app_metadata and uses the service role key", async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const fakeFetch = (async (url: string, init?: RequestInit) => {
    requests.push({ url, init });
    if (init?.method === "PUT") {
      return new Response(JSON.stringify({ id: "usr_dev", email: "dev@korelumina.test", app_metadata: JSON.parse(String(init.body)).app_metadata }));
    }
    return new Response(JSON.stringify({ users: [{ id: "usr_dev", email: "dev@korelumina.test", app_metadata: { provider: "email", providers: ["email"] } }] }));
  }) as typeof fetch;

  const supabase = new SupabaseAdminUserDirectory("https://project.supabase.co", "service-role-key", fakeFetch);
  const [user] = await supabase.list();
  const updated = await supabase.setRole(user, "admin");

  assert.equal(requests[0].url, "https://project.supabase.co/auth/v1/admin/users?page=1&per_page=200");
  assert.equal((requests[1].init?.headers as Record<string, string>).apikey, "service-role-key");
  assert.deepEqual(JSON.parse(String(requests[1].init?.body)), { app_metadata: { provider: "email", providers: ["email"], role: "admin" } });
  assert.equal(updated.role, "admin");
});
