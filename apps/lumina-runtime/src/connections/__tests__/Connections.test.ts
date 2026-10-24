import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import express from "express";

import { registerConnectionRoutes } from "../../routes/connections.js";
import { openSecret, sealSecret } from "../ConnectionCrypto.js";
import { ConnectionService } from "../ConnectionService.js";
import type { ConnectionProvider, ConnectionProviderId, ProviderConfig, TokenSet } from "../ConnectionTypes.js";
import { GitHubConnection } from "../providers/GitHubConnection.js";
import { SupabaseConnection } from "../providers/SupabaseConnection.js";
import { VercelConnection } from "../providers/VercelConnection.js";

/* MS-2026-0016: connected accounts never expose a token, and every use is recorded. */

const KEY = crypto.randomBytes(32);
const CONFIG: ProviderConfig = { clientId: "client-id", clientSecret: "client-secret", slug: "korelumina" };
const SECRET_TOKEN = "ghu_super_secret_access_token";
const SECRET_REFRESH = "ghr_super_secret_refresh_token";

function fakeProvider(overrides: Partial<ConnectionProvider> = {}): ConnectionProvider & { calls: string[] } {
  const calls: string[] = [];
  return {
    id: "github",
    label: "GitHub",
    calls,
    authorizeUrl: ({ state, challenge }) => `https://provider.example/authorize?state=${state}&challenge=${challenge}`,
    exchange: async ({ code, verifier }) => {
      calls.push(`exchange:${code}:${verifier.length}`);
      return {
        tokens: { accessToken: SECRET_TOKEN, refreshToken: SECRET_REFRESH, expiresAt: Date.now() + 8 * 3600_000, refreshExpiresAt: Date.now() + 180 * 86400_000 },
        account: { id: "42", login: "ada", name: "Ada", teamId: null, installationId: null },
      };
    },
    refresh: async () => {
      calls.push("refresh");
      return { accessToken: "ghu_renewed", refreshToken: null, expiresAt: Date.now() + 8 * 3600_000, refreshExpiresAt: null };
    },
    revoke: async () => {
      calls.push("revoke");
      return true;
    },
    manageUrl: () => "https://provider.example/settings",
    ...overrides,
  };
}

function service(provider = fakeProvider(), opts: { key?: Buffer | null; now?: () => number } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "connections-"));
  const providers = { github: provider, supabase: provider, vercel: provider } as Record<ConnectionProviderId, ConnectionProvider>;
  const svc = new ConnectionService({
    root: () => root,
    key: () => (opts.key === undefined ? KEY : opts.key),
    config: () => CONFIG,
    providers,
    now: opts.now,
  });
  return { svc, root, provider };
}

function everyFile(root: string): string {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(fs.readFileSync(full, "utf8"));
    }
  };
  walk(root);
  return out.join("\n");
}

async function connect(svc: ConnectionService, userId = "user-1") {
  const url = new URL(svc.start(userId, "github", "http://runtime/cb", "http://builder"));
  return svc.complete("github", { code: "the-code", state: url.searchParams.get("state") as string }, "http://runtime/cb");
}

test("sealed secrets open only with the right key and owner", () => {
  const sealed = sealSecret("token", KEY, "alice:github");
  assert.equal(openSecret(sealed, KEY, "alice:github"), "token");
  assert.throws(() => openSecret(sealed, KEY, "mallory:github"), /connection_secret_unreadable/);
  assert.throws(() => openSecret(sealed, crypto.randomBytes(32), "alice:github"), /connection_secret_unreadable/);
  const tampered = sealed.slice(0, -4) + (sealed.endsWith("AAAA") ? "BBBB" : "AAAA");
  assert.throws(() => openSecret(tampered, KEY, "alice:github"), /connection_secret_unreadable/);
});

test("connecting stores the tokens sealed, never in plain, and shows only the account", async () => {
  const { svc, root, provider } = service();
  const done = await connect(svc);
  assert.equal(done.connection.status, "connected");
  assert.equal(done.connection.account.login, "ada");
  assert.equal(done.returnTo, "http://builder");
  assert.match(provider.calls[0], /^exchange:the-code:\d+$/);

  const disk = everyFile(root);
  assert.ok(!disk.includes(SECRET_TOKEN) && !disk.includes(SECRET_REFRESH), "no token in plain on disk");
  const listed = JSON.stringify(svc.list("user-1"));
  assert.ok(!listed.includes(SECRET_TOKEN) && !listed.includes("sealed"), "no token or sealed blob in the list");
  assert.equal(svc.list("user-2").find((item) => item.provider === "github")?.connection, null, "another person sees nothing");
});

test("a state is single-use, bound to its provider, and expires", async () => {
  let now = 1_000_000;
  const { svc } = service(fakeProvider(), { now: () => now });
  const state = new URL(svc.start("u", "github", "cb", "back")).searchParams.get("state") as string;
  await assert.rejects(svc.complete("supabase", { code: "c", state }, "cb"), /connection_state_invalid/);

  const fresh = new URL(svc.start("u", "github", "cb", "back")).searchParams.get("state") as string;
  await svc.complete("github", { code: "c", state: fresh }, "cb");
  await assert.rejects(svc.complete("github", { code: "c", state: fresh }, "cb"), /connection_state_invalid/);

  const late = new URL(svc.start("u", "github", "cb", "back")).searchParams.get("state") as string;
  now += 11 * 60 * 1000;
  await assert.rejects(svc.complete("github", { code: "c", state: late }, "cb"), /connection_state_invalid/);
  await assert.rejects(svc.complete("github", { code: "c", state: "forged" }, "cb"), /connection_state_invalid/);
});

test("without the Runtime key nothing can be connected", () => {
  const { svc } = service(fakeProvider(), { key: null });
  assert.throws(() => svc.start("u", "github", "cb", "back"), /connections_key_missing/);
  assert.equal(svc.readiness().storeReady, false);
});

test("every use is recorded, and an expiring token is refreshed first", async () => {
  let now = Date.now();
  const { svc, provider } = service(fakeProvider(), { now: () => now });
  await connect(svc);
  const first = await svc.accessToken("user-1", "github", { projectId: "shop", action: "export" });
  assert.equal(first.token, SECRET_TOKEN);
  now += 8 * 3600_000;
  const second = await svc.accessToken("user-1", "github", { projectId: "shop", action: "push" });
  assert.equal(second.token, "ghu_renewed");
  assert.ok(provider.calls.includes("refresh"));
  const uses = svc.uses("user-1").map((use) => `${use.action}:${use.outcome}:${use.projectId}`);
  assert.deepEqual(uses, ["push:refreshed:shop", "export:used:shop", "connect:used:null"]);
  assert.ok(!JSON.stringify(svc.uses("user-1")).includes("ghu_"), "no token in the use log");
});

test("a refused refresh disconnects instead of retrying silently", async () => {
  let now = Date.now();
  const { svc } = service(fakeProvider({ refresh: async () => { throw new Error("github_refresh_failed:unauthorized"); } }), { now: () => now });
  await connect(svc);
  now += 9 * 3600_000;
  await assert.rejects(svc.accessToken("user-1", "github", { projectId: null, action: "push" }), /connection_lost:github/);
  const connection = svc.list("user-1").find((item) => item.provider === "github")?.connection;
  assert.equal(connection?.status, "disconnected");
  assert.equal(connection?.disconnectedReason, "refresh_refused");
  await assert.rejects(svc.accessToken("user-1", "github", { projectId: null, action: "push" }), /not_connected:github/);
});

test("disconnect deletes the tokens and asks the provider to withdraw access", async () => {
  const { svc, root, provider } = service();
  await connect(svc);
  const result = await svc.disconnect("user-1", "github");
  assert.equal(result.revokedAtProvider, true);
  assert.ok(provider.calls.includes("revoke"));
  assert.equal(svc.list("user-1").find((item) => item.provider === "github")?.connection, null);
  assert.ok(!everyFile(root).includes("sealed"));
});

async function withFetch<T>(fake: (url: string, init?: RequestInit) => Response | Promise<Response>, run: () => Promise<T>): Promise<T> {
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => fake(String(url), init)) as typeof fetch;
  try {
    return await run();
  } finally {
    globalThis.fetch = original;
  }
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

test("GitHub: PKCE authorize URL, code exchange with the verifier, account from /user", async () => {
  const url = new URL(GitHubConnection.authorizeUrl({ config: CONFIG, state: "s", challenge: "c", redirectUri: "http://cb" }));
  assert.equal(url.origin + url.pathname, "https://github.com/login/oauth/authorize");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("allow_signup"), "true");

  const seen: string[] = [];
  const result = await withFetch(
    (target, init) => {
      seen.push(target);
      if (target.endsWith("/login/oauth/access_token")) {
        const body = new URLSearchParams(String(init?.body));
        assert.equal(body.get("code_verifier"), "verifier");
        assert.equal(body.get("client_secret"), "client-secret");
        return json({ access_token: "ghu_x", expires_in: 28800, refresh_token: "ghr_x", refresh_token_expires_in: 15897600, token_type: "bearer", scope: "" });
      }
      assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer ghu_x");
      return json({ id: 7, login: "ada", name: "Ada" });
    },
    () => GitHubConnection.exchange({ config: CONFIG, code: "code", verifier: "verifier", redirectUri: "http://cb", query: {} }),
  );
  assert.deepEqual(seen, ["https://github.com/login/oauth/access_token", "https://api.github.com/user"]);
  assert.equal(result.account.login, "ada");
  assert.ok(result.tokens.expiresAt && result.tokens.refreshExpiresAt);
});

test("Supabase: client credentials as Basic auth, form body, organisations named", async () => {
  const result = await withFetch(
    (target, init) => {
      if (target.endsWith("/v1/oauth/token")) {
        assert.equal((init?.headers as Record<string, string>).Authorization, `Basic ${Buffer.from("client-id:client-secret").toString("base64")}`);
        const body = new URLSearchParams(String(init?.body));
        assert.equal(body.get("grant_type"), "authorization_code");
        assert.equal(body.get("code_verifier"), "verifier");
        return json({ access_token: "sbp_oauth_x", refresh_token: "r", expires_in: 3600 });
      }
      assert.equal(target, "https://api.supabase.com/v1/organizations");
      return json([{ id: "o1", name: "Ada Labs", slug: "ada-labs" }]);
    },
    () => SupabaseConnection.exchange({ config: CONFIG, code: "code", verifier: "verifier", redirectUri: "http://cb", query: {} }),
  );
  assert.equal(result.account.login, "Ada Labs");
  assert.equal(result.account.id, "ada-labs");
});

test("Vercel: code exchanged once for a long-lived token; team installs keep their team", async () => {
  const result = await withFetch(
    (target, init) => {
      if (target.endsWith("/v2/oauth/access_token")) {
        const body = new URLSearchParams(String(init?.body));
        assert.equal(body.get("redirect_uri"), "http://cb");
        return json({ token_type: "Bearer", access_token: "vercel_x", installation_id: "icfg_1", user_id: "u1", team_id: "team_1" });
      }
      assert.equal(target, "https://api.vercel.com/v2/teams/team_1");
      return json({ id: "team_1", slug: "ada-team", name: "Ada Team" });
    },
    () => VercelConnection.exchange({ config: CONFIG, code: "code", verifier: "", redirectUri: "http://cb", query: { configurationId: "icfg_1", teamId: "team_1" } }),
  );
  assert.equal(result.tokens.expiresAt, null);
  assert.deepEqual(result.account, { id: "team_1", login: "ada-team", name: "Ada Team", teamId: "team_1", installationId: "icfg_1" });
  assert.equal(VercelConnection.refresh, null);
});

test("routes: signed in only; the callback returns to the Builder, never with a token", async () => {
  const { svc } = service();
  const app = express();
  app.use(express.json());
  registerConnectionRoutes(app, { service: svc, env: { KORELUMINA_BUILDER_URL: "http://builder.test", KORELUMINA_CONNECTIONS_CALLBACK_BASE: "http://runtime.test" } });
  const server = app.listen(0);
  try {
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    assert.equal((await fetch(`${base}/api/connections`)).status, 401);

    const headers = { "x-korelumina-role": "pro", "x-korelumina-user-id": "user-9" };
    const started = (await (await fetch(`${base}/api/connections/github/start`, { method: "POST", headers })).json()) as { url: string };
    const state = new URL(started.url).searchParams.get("state") as string;

    const callback = await fetch(`${base}/api/connections/github/callback?code=abc&state=${state}`, { redirect: "manual" });
    assert.equal(callback.status, 303);
    const location = callback.headers.get("location") as string;
    assert.equal(location, "http://builder.test/?connection=github&connection_result=connected");

    const forged = await fetch(`${base}/api/connections/github/callback?code=abc&state=forged`, { redirect: "manual" });
    assert.equal(forged.headers.get("location"), "http://builder.test/?connection=github&connection_result=connection_state_invalid");

    const listed = await (await fetch(`${base}/api/connections`, { headers })).text();
    assert.match(listed, /"login":"ada"/);
    assert.ok(!listed.includes(SECRET_TOKEN));
    assert.equal((await fetch(`${base}/api/connections/gitlab/start`, { method: "POST", headers })).status, 404);
  } finally {
    server.close();
  }
});
