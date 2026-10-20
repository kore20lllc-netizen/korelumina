import assert from "node:assert/strict";
import test from "node:test";

import type { Request } from "express";

import { getRuntimeCaller, isTrustedCallerSource } from "../runtimeCaller.js";

/* SEC-1b: caller headers are believed only from a trusted source. */

function request(
  remoteAddress: string,
  headers: Record<string, string>,
): Request {
  const lower = Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]),
  );
  return {
    socket: { remoteAddress },
    header: (name: string) => lower[name.toLowerCase()],
  } as unknown as Request;
}

const claimsSuperAdmin = {
  "x-korelumina-role": "super_admin",
  "x-korelumina-user-id": "usr_someone_else",
  "x-korelumina-team-id": "team_someone_else",
};

test("a remote caller claiming super_admin is an anonymous user", () => {
  const caller = getRuntimeCaller(request("203.0.113.7", claimsSuperAdmin));
  assert.deepEqual(caller, { role: "user", supportAccess: false, adminTools: false });
});

test("on this machine, outside production, local development keeps working", () => {
  const caller = getRuntimeCaller(request("127.0.0.1", claimsSuperAdmin));
  assert.equal(caller.role, "super_admin");
  assert.equal(caller.userId, "usr_someone_else");
  assert.equal(caller.adminTools, true);
});

test("in production even this machine is not trusted without the internal token", () => {
  assert.equal(
    isTrustedCallerSource(request("127.0.0.1", claimsSuperAdmin), { NODE_ENV: "production" }),
    false,
  );
});

test("the Runtime internal token makes a caller trusted anywhere", () => {
  const environment = { NODE_ENV: "production", KORELUMINA_RUNTIME_INTERNAL_TOKEN: "secret-token" };
  assert.equal(
    isTrustedCallerSource(
      request("203.0.113.7", { ...claimsSuperAdmin, "x-korelumina-runtime-token": "secret-token" }),
      environment,
    ),
    true,
  );
  assert.equal(
    isTrustedCallerSource(
      request("203.0.113.7", { ...claimsSuperAdmin, "x-korelumina-runtime-token": "wrong" }),
      environment,
    ),
    false,
  );
});

/* SEC-1c (ADR-0043 Decision 5): the development identity is configured, never browser-chosen. */
import { developmentIdentity } from "../runtimeCaller.js";

test("a configured development identity is used outside production", () => {
  assert.deepEqual(
    developmentIdentity({ NODE_ENV: "development", KORELUMINA_DEV_IDENTITY: "super_admin:usr_owner" }),
    { userId: "usr_owner", teamId: undefined, role: "super_admin", supportAccess: true, adminTools: true },
  );
});

test("production refuses the development identity", () => {
  assert.equal(
    developmentIdentity({ NODE_ENV: "production", KORELUMINA_DEV_IDENTITY: "super_admin:usr_owner" }),
    null,
  );
});
