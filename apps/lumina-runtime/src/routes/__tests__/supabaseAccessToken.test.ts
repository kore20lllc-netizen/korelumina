import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import type { NextFunction, Request, Response } from "express";

import { SupabaseAccessTokenVerifier } from "../supabaseAccessToken.js";
import { getRuntimeCaller, resolveRuntimeCaller } from "../runtimeCaller.js";

/* SEC-1c (ADR-0043): Runtime identifies callers from verified Supabase tokens. */

const URL = "https://project.supabase.co";
const NOW = Date.UTC(2026, 9, 19, 20, 0, 0);
const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "key-1", alg: "ES256" };
const SECRET = "test-jwt-secret-of-sufficient-length";

function b64(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function claims(overrides: Record<string, unknown> = {}) {
  return {
    sub: "usr_owner",
    aud: "authenticated",
    iss: `${URL}/auth/v1`,
    exp: Math.floor(NOW / 1000) + 3600,
    app_metadata: { provider: "email", role: "super_admin" },
    user_metadata: { role: "user" },
    ...overrides,
  };
}

function es256(payload: Record<string, unknown>, header: Record<string, unknown> = { alg: "ES256", kid: "key-1", typ: "JWT" }) {
  const signed = `${b64(header)}.${b64(payload)}`;
  const signature = crypto.sign("sha256", Buffer.from(signed), { key: privateKey, dsaEncoding: "ieee-p1363" });
  return `${signed}.${signature.toString("base64url")}`;
}

function hs256(payload: Record<string, unknown>, secret = SECRET) {
  const signed = `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}`;
  return `${signed}.${crypto.createHmac("sha256", secret).update(signed).digest("base64url")}`;
}

let fetches = 0;
function verifier(config: { url?: string; jwtSecret?: string } = { url: URL, jwtSecret: SECRET }) {
  return new SupabaseAccessTokenVerifier(
    config,
    async () => {
      fetches += 1;
      return { keys: [jwk] };
    },
    () => NOW,
  );
}

test("a valid ES256 token is the caller, with the role from app_metadata", async () => {
  const result = await verifier().verify(es256(claims()));
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.identity.userId, "usr_owner");
  assert.equal(result.ok && result.identity.role, "super_admin", "never user_metadata");
});

test("a valid HS256 token is accepted with the project secret", async () => {
  const result = await verifier().verify(hs256(claims()));
  assert.equal(result.ok, true);
});

for (const [name, token, reason] of [
  ["expired", () => es256(claims({ exp: Math.floor(NOW / 1000) - 120 })), "expired"],
  ["another project", () => es256(claims({ iss: "https://other.supabase.co/auth/v1" })), "wrong_issuer"],
  ["wrong audience", () => es256(claims({ aud: "anon" })), "wrong_audience"],
  ["alg none", () => `${b64({ alg: "none" })}.${b64(claims())}.`, "algorithm_refused:none"],
  ["wrong HS256 secret", () => hs256(claims(), "attacker-secret"), "bad_signature"],
  ["unknown key", () => es256(claims(), { alg: "ES256", kid: "key-unknown" }), "unknown_signing_key"],
  ["tampered role", () => {
    const [h, , s] = es256(claims()).split(".");
    return `${h}.${b64(claims({ app_metadata: { role: "super_admin" }, sub: "usr_attacker" }))}.${s}`;
  }, "bad_signature"],
  ["garbage", () => "not-a-token", "malformed_token"],
] as const) {
  test(`refuses a token: ${name}`, async () => {
    const result = await verifier().verify(token());
    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.reason, reason);
  });
}

test("without Supabase configured, no token is ever accepted", async () => {
  const result = await verifier({}).verify(es256(claims()));
  assert.deepEqual(result, { ok: false, reason: "supabase_not_configured" });
});

test("signing keys are fetched once and reused", async () => {
  const shared = verifier();
  const before = fetches;
  await shared.verify(es256(claims()));
  await shared.verify(es256(claims()));
  assert.equal(fetches - before, 1);
});

function request(remoteAddress: string, headers: Record<string, string>): Request {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return { socket: { remoteAddress }, header: (name: string) => lower[name.toLowerCase()] } as unknown as Request;
}

async function resolved(req: Request) {
  await resolveRuntimeCaller(verifier())(req, {} as Response, (() => undefined) as NextFunction);
  return getRuntimeCaller(req);
}

test("a remote request with a valid token is its verified user, whatever headers say", async () => {
  const caller = await resolved(
    request("203.0.113.7", {
      authorization: `Bearer ${es256(claims({ app_metadata: { role: "pro" } }))}`,
      "x-korelumina-role": "super_admin",
      "x-korelumina-user-id": "usr_someone_else",
      "x-korelumina-team-id": "team_someone_else",
    }),
  );
  assert.deepEqual(caller, { userId: "usr_owner", teamId: undefined, role: "pro", supportAccess: false, adminTools: false });
});

test("an invalid token is anonymous even from this machine; it never falls back to headers", async () => {
  const caller = await resolved(
    request("127.0.0.1", {
      authorization: `Bearer ${hs256(claims(), "attacker-secret")}`,
      "x-korelumina-role": "super_admin",
    }),
  );
  assert.deepEqual(caller, { role: "user", supportAccess: false, adminTools: false });
});

test("a plan role such as free is a plain user", async () => {
  const caller = await resolved(
    request("203.0.113.7", { authorization: `Bearer ${es256(claims({ app_metadata: { role: "free" } }))}` }),
  );
  assert.equal(caller.role, "user");
  assert.equal(caller.userId, "usr_owner");
});
