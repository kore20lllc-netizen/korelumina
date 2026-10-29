import assert from "node:assert/strict";
import crypto from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import test from "node:test";
import express from "express";
import { registerMobileCompatibilityRoute, type MobileCompatibilityRouteDependencies } from "../mobileCompatibility.js";
import { resolveRuntimeCaller } from "../runtimeCaller.js";
import { SupabaseAccessTokenVerifier } from "../supabaseAccessToken.js";
import { takeRepositorySnapshotAsync } from "../../repository-intelligence/RepositorySnapshot.js";

const issuer = "https://mobile-fixture.supabase.co";
const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "mobile", alg: "ES256" };
const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
function token(userId = "alice", role = "pro", extra = {}) {
  const input = `${b64({ alg: "ES256", kid: "mobile" })}.${b64({ sub: userId, iss: `${issuer}/auth/v1`, aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600, app_metadata: { role }, ...extra })}`;
  return `${input}.${crypto.sign("sha256", Buffer.from(input), { key: privateKey, dsaEncoding: "ieee-p1363" }).toString("base64url")}`;
}
const files = { "package.json": JSON.stringify({ dependencies: { react: "18", vite: "5" }, scripts: { build: "vite build" } }), "index.html": "<head></head>", "src/main.tsx": "throw new Error('must never execute');", ".env": "PRIVATE_TOKEN=do-not-disclose" };
async function fixture(run: (api: { get(query?: string, headers?: Record<string, string>, project?: string): Promise<Response>; root: string; calls: string[] }) => Promise<void>, overrides: Partial<MobileCompatibilityRouteDependencies> = {}, contents: Record<string, string> = files) {
  const root = mkdtempSync(path.join(tmpdir(), "klm-mobile-route-"));
  for (const [file, text] of Object.entries(contents)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); writeFileSync(path.join(root, file), text);
  }
  const calls: string[] = [];
  const app = express();
  app.use(resolveRuntimeCaller(new SupabaseAccessTokenVerifier({ url: issuer }, async () => ({ keys: [jwk] }))));
  registerMobileCompatibilityRoute(app, {
    metadata: projectId => { calls.push("metadata"); return projectId === "shop" ? { projectId, ownerId: "alice", visibility: "private", createdAt: 1, updatedAt: 1 } : null; },
    projectRoot: () => { calls.push("root"); return root; },
    snapshot: async directory => { calls.push("snapshot"); return takeRepositorySnapshotAsync(directory); },
    ...overrides,
  });
  // Disposable HTTP test listener; existing development ports are untouched.
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    await run({ root, calls, get: (query = "", headers = { authorization: `Bearer ${token()}` }, project = "shop") => fetch(`${base}/api/runtime/mobile/${project}/compatibility${query}`, { headers }) });
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    rmSync(root, { recursive: true, force: true });
  }
}

test("verified owner receives deterministic real snapshot evidence without source contents or mutation", async () => {
  await fixture(async ({ get, calls, root }) => {
    const first = await get(); assert.equal(first.status, 200); assert.equal(first.headers.get("cache-control"), "no-store");
    const output = await first.json();
    assert.deepEqual(output, await (await get()).json());
    assert.deepEqual(calls, ["metadata", "root", "snapshot", "metadata", "root", "snapshot"]);
    assert.equal(output.report.applications[0].classification, "candidate");
    assert.equal(output.report.buildVerification, "not-performed");
    assert.match(output.report.reportFingerprint, /^[a-f0-9]{64}$/);
    const text = JSON.stringify(output); for (const secret of [root, "do-not-disclose", "must never execute"]) assert.ok(!text.includes(secret));
    for (const [file, content] of Object.entries(files)) assert.equal(readFileSync(path.join(root, file), "utf8"), content);
  });
});
for (const [name, headers] of [
  ["anonymous", {}], ["spoofed local owner and admin", { "x-korelumina-user-id": "alice", "x-korelumina-role": "super_admin" }],
  ["malformed bearer", { authorization: "Bearer malformed" }],
  ["expired bearer", { authorization: `Bearer ${token("alice", "pro", { exp: 1 })}` }],
  ["foreign issuer", { authorization: `Bearer ${token("alice", "pro", { iss: "https://other.supabase.co/auth/v1" })}` }],
] as [string, Record<string, string>][]) {
  test(`${name} is rejected before any project lookup`, async () => {
    await fixture(async ({ get, calls }) => { assert.equal((await get("", headers)).status, 401); assert.deepEqual(calls, []); });
  });
}
test("development identity never substitutes for authentication", async () => {
  const old = process.env.KORELUMINA_DEV_IDENTITY; process.env.KORELUMINA_DEV_IDENTITY = "super_admin:alice";
  try { await fixture(async ({ get, calls }) => { assert.equal((await get("", {})).status, 401); assert.deepEqual(calls, []); }); }
  finally { if (old === undefined) delete process.env.KORELUMINA_DEV_IDENTITY; else process.env.KORELUMINA_DEV_IDENTITY = old; }
});
test("another tenant and unknown project receive identical denial without repository reads", async () => {
  await fixture(async ({ get, calls }) => {
    const headers = { authorization: `Bearer ${token("mallory")}`, "x-korelumina-role": "super_admin", "x-korelumina-user-id": "alice" };
    const denied = await get("", headers); const missing = await get("", headers, "missing");
    assert.equal(denied.status, 404); assert.equal(missing.status, 404); assert.deepEqual(await denied.json(), await missing.json());
    assert.deepEqual(calls, ["metadata", "metadata"]);
  });
});
test("verified staff preserves existing project-view policy", async () => {
  await fixture(async ({ get }) => { assert.equal((await get("", { authorization: `Bearer ${token("staff", "inhouse-dev")}` })).status, 200); });
});
for (const query of ["?applicationRoot=../escape", "?applicationRoot=%2Fabsolute", "?applicationRoot=a%5Cb", "?applicationRoot=a%252Fb", "?applicationRoot=", "?applicationRoot=a&applicationRoot=b", "?applicationRoot[x]=a", "?root=/tmp"]) {
  test(`invalid selection ${query} is rejected without repository reads`, async () => {
    await fixture(async ({ get, calls }) => { assert.equal((await get(query)).status, 400); assert.deepEqual(calls, []); });
  });
}
test("unsafe project id is rejected before lookup", async () => {
  await fixture(async ({ get, calls }) => { assert.equal((await get("", undefined, "a%2Fb")).status, 400); assert.deepEqual(calls, []); });
});
test("missing and unsafe project roots fail closed with sanitized errors", async () => {
  for (const message of ["project_not_found:/private/secret", "project_path_escape_detected", "unsafe_project_root"]) {
    await fixture(async ({ get, calls }) => {
      const response = await get(); assert.equal(response.status, 404); assert.deepEqual(await response.json(), { ok: false, error: "project_not_found" });
      assert.ok(!calls.includes("snapshot"));
    }, { projectRoot: () => { throw new Error(message); } });
  }
});
test("snapshot acquisition failure never exposes exception contents", async () => {
  await fixture(async ({ get }) => {
    const response = await get(); assert.equal(response.status, 422); assert.deepEqual(await response.json(), { ok: false, error: "repository_snapshot_unavailable" });
  }, { snapshot: async () => { throw new Error("secret=/private/token"); } });
});
test("malformed and unsafe snapshots are rejected by the real analyzer", async () => {
  for (const unsafe of [false, true]) await fixture(async ({ get }) => {
    const response = await get(); assert.equal(response.status, 422); assert.deepEqual(await response.json(), { ok: false, error: unsafe ? "unsafe_path" : "invalid_snapshot" });
  }, { snapshot: async root => {
    const snapshot = await takeRepositorySnapshotAsync(root);
    return unsafe ? { ...snapshot, files: [{ ...snapshot.files[0], path: "../secret" }] } : { ...snapshot, fingerprint: "malformed" };
  } });
});
test("ambiguous monorepo requires an explicit valid application root", async () => {
  const contents = Object.fromEntries(["apps/a", "apps/b"].flatMap(root => Object.entries(files).map(([file, value]) => [`${root}/${file}`, value])));
  await fixture(async ({ get }) => {
    const ambiguous = await get(); assert.equal(ambiguous.status, 409); assert.equal((await ambiguous.json()).report.selection, "ambiguous");
    const selected = await get("?applicationRoot=apps/a"); assert.equal(selected.status, 200); assert.equal((await selected.json()).report.selectedApplicationRoot, "apps/a");
    assert.equal((await get("?applicationRoot=apps/missing")).status, 422);
  }, {}, contents);
});
test("unknown requested root is rejected and unknown frameworks remain honest reports", async () => {
  await fixture(async ({ get }) => { assert.equal((await get("?applicationRoot=missing")).status, 422); });
  await fixture(async ({ get }) => { const response = await get(); assert.equal(response.status, 200); assert.equal((await response.json()).report.applications[0].classification, "unknown"); }, {}, { "README.md": "Unknown project" });
});
test("actual snapshot excludes symlinks to foreign repository files", async () => {
  await fixture(async ({ get, root }) => {
    symlinkSync(path.join(root, ".env"), path.join(root, "foreign-package.json"));
    const response = await get(); assert.equal(response.status, 200); assert.ok(!JSON.stringify(await response.json()).includes("foreign-package"));
  });
});


test("internal callers require the existing secret and a user identity", async () => {
  const old = process.env.KORELUMINA_RUNTIME_INTERNAL_TOKEN;
  process.env.KORELUMINA_RUNTIME_INTERNAL_TOKEN = "mobile-disposable-test-secret";
  const headers = { "x-korelumina-runtime-token": "mobile-disposable-test-secret", "x-korelumina-user-id": "alice", "x-korelumina-role": "pro" };
  try {
    await fixture(async ({ get }) => {
      assert.equal((await get("", headers)).status, 200);
      assert.equal((await get("", { ...headers, "x-korelumina-user-id": "" })).status, 401);
      assert.equal((await get("", { ...headers, "x-korelumina-runtime-token": "wrong" })).status, 401);
      assert.equal((await get("", { ...headers, authorization: "Bearer invalid" })).status, 401);
      assert.equal((await get("", { ...headers, "x-korelumina-user-id": "mallory" })).status, 404);
    });
  } finally {
    if (old === undefined) delete process.env.KORELUMINA_RUNTIME_INTERNAL_TOKEN;
    else process.env.KORELUMINA_RUNTIME_INTERNAL_TOKEN = old;
  }
});
test("verified token cannot claim team access via browser headers", async () => {
  await fixture(async ({ get, calls }) => {
    const response = await get("", { authorization: `Bearer ${token("mallory")}`, "x-korelumina-team-id": "team-a" });
    assert.equal(response.status, 404); assert.ok(!calls.includes("snapshot"));
  }, { metadata: projectId => ({ projectId, ownerId: "alice", teamId: "team-a", visibility: "team", createdAt: 1, updatedAt: 1 }) });
});
