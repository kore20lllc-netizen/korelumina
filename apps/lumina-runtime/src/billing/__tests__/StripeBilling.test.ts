import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import express from "express";

import type { DirectoryUser } from "../../governance/roles/RoleAssignment.js";
import { registerStripeWebhookRoute, STRIPE_WEBHOOK_PATH } from "../../routes/stripeWebhook.js";
import {
  FilePlanAssignmentLedger,
  FileStripeEventStore,
  StripeBillingService,
  planOfSubscription,
  priceMapFromEnvironment,
  type PlanDirectory,
} from "../StripeBilling.js";
import { signStripePayload, verifyStripeSignature, type StripeEvent } from "../StripeSignature.js";

/* MS-2026-0003: plan roles are assigned only by Stripe's verified webhook. */

const SECRET = "whsec_test_secret";
const PRICES = priceMapFromEnvironment({ STRIPE_PRICE_PRO: "price_pro", STRIPE_PRICE_BUSINESS: "price_biz, price_biz_year", STRIPE_PRICE_ENTERPRISE: "price_ent" } as NodeJS.ProcessEnv);

function user(id: string, role: string | null, plan?: string): DirectoryUser {
  return { id, email: `${id}@example.com`, role, createdAt: null, lastSignInAt: null, appMetadata: { role, ...(plan ? { plan } : {}), provider: "email" } };
}

function directory(users: DirectoryUser[], options: { fail?: boolean } = {}) {
  const store = new Map(users.map((entry) => [entry.id, entry]));
  const writes: Array<{ id: string; patch: Record<string, unknown> }> = [];
  const fake: PlanDirectory & { writes: typeof writes; store: typeof store } = {
    configured: true,
    writes,
    store,
    async get(id) {
      if (options.fail) throw new Error("user_directory_failed:503");
      return store.get(id) ?? null;
    },
    async updateAppMetadata(entry, patch) {
      writes.push({ id: entry.id, patch });
      const appMetadata = { ...entry.appMetadata, ...patch };
      const next = { ...entry, appMetadata, role: typeof appMetadata.role === "string" ? appMetadata.role : null };
      store.set(entry.id, next);
      return next;
    },
  };
  return fake;
}

function service(dir: PlanDirectory) {
  const root = mkdtempSync(path.join(tmpdir(), "korelumina-billing-events-"));
  const stableEvents = new FileStripeEventStore(() => root);
  const ledgerRoot = mkdtempSync(path.join(tmpdir(), "korelumina-plan-ledger-"));
  const ledger = new FilePlanAssignmentLedger(() => ledgerRoot);
  return { billing: new StripeBillingService(dir, stableEvents, ledger, PRICES, () => new Date("2026-10-22T06:00:00.000Z")), ledger, events: stableEvents };
}

let sequence = 0;
function subscriptionEvent(input: {
  type?: string;
  status?: string;
  price?: string;
  userId?: string | null;
  created?: number;
  subscriptionId?: string;
  id?: string;
}): StripeEvent {
  sequence += 1;
  return {
    id: input.id ?? `evt_${sequence}`,
    type: input.type ?? "customer.subscription.updated",
    created: input.created ?? 1_792_000_000 + sequence,
    livemode: false,
    data: {
      object: {
        id: input.subscriptionId ?? "sub_1",
        object: "subscription",
        status: input.status ?? "active",
        metadata: input.userId === null ? {} : { korelumina_user_id: input.userId ?? "u1" },
        items: { data: [{ price: { id: input.price ?? "price_biz" } }] },
      },
    },
  };
}

test("a valid signature verifies; a wrong secret, a tampered body or an old timestamp does not", () => {
  const body = JSON.stringify(subscriptionEvent({}));
  const now = 1_792_650_000;
  const header = signStripePayload(body, SECRET, now);
  assert.equal(verifyStripeSignature(Buffer.from(body), header, SECRET, now).ok, true);
  assert.deepEqual(verifyStripeSignature(Buffer.from(body), header, "whsec_other", now), { ok: false, reason: "signature_mismatch" });
  assert.deepEqual(verifyStripeSignature(Buffer.from(body.replace("active", "trialing")), header, SECRET, now), { ok: false, reason: "signature_mismatch" });
  assert.deepEqual(verifyStripeSignature(Buffer.from(body), header, SECRET, now + 301), { ok: false, reason: "timestamp_outside_tolerance" });
  assert.deepEqual(verifyStripeSignature(Buffer.from(body), undefined, SECRET, now), { ok: false, reason: "missing_signature" });
  assert.deepEqual(verifyStripeSignature(Buffer.from(body), "t=abc,v1=zz", SECRET, now), { ok: false, reason: "malformed_signature" });
  const second = `${header},v1=${"0".repeat(64)}`;
  assert.equal(verifyStripeSignature(Buffer.from(body), second, SECRET, now).ok, true, "any one matching v1 signature is enough");
});

test("prices map to plans from the environment, and the highest plan wins", () => {
  assert.equal(PRICES.get("price_biz_year"), "business");
  assert.equal(planOfSubscription({ items: { data: [{ price: { id: "price_pro" } }, { price: { id: "price_ent" } }] } }, PRICES), "enterprise");
  assert.equal(planOfSubscription({ items: { data: [{ price: { id: "price_unknown" } }] } }, PRICES), null);
  assert.throws(() => priceMapFromEnvironment({ STRIPE_PRICE_PRO: "price_x", STRIPE_PRICE_BUSINESS: "price_x" } as NodeJS.ProcessEnv), /stripe_price_mapped_twice/);
});

test("an active subscription grants its plan and records who, from, to, event and time", async () => {
  const dir = directory([user("u1", "user")]);
  const { billing, ledger } = service(dir);
  assert.equal(await billing.handle(subscriptionEvent({ id: "evt_grant" })), "granted");
  assert.deepEqual(dir.writes, [{ id: "u1", patch: { role: "business", plan: "business" } }]);
  assert.equal(dir.store.get("u1")?.appMetadata.provider, "email", "other app_metadata is kept");
  const [record] = ledger.list();
  assert.equal(record.userId, "u1");
  assert.equal(record.fromRole, "user");
  assert.equal(record.toRole, "business");
  assert.equal(record.eventId, "evt_grant");
  assert.equal(record.assignedBy, "system:stripe");
  assert.equal(record.assignedAt, "2026-10-22T06:00:00.000Z");
  assert.equal(JSON.stringify(record).includes("@example.com"), false, "no email in the committed record");
});

test("a replayed event changes nothing", async () => {
  const dir = directory([user("u1", "user")]);
  const { billing, ledger } = service(dir);
  const event = subscriptionEvent({});
  assert.equal(await billing.handle(event), "granted");
  assert.equal(await billing.handle(event), "duplicate");
  assert.equal(dir.writes.length, 1);
  assert.equal(ledger.list().length, 1);
});

test("an event older than the last one applied to the subscription changes nothing", async () => {
  const dir = directory([user("u1", "user")]);
  const { billing } = service(dir);
  assert.equal(await billing.handle(subscriptionEvent({ created: 2_000, type: "customer.subscription.deleted", status: "canceled" })), "unchanged");
  assert.equal(await billing.handle(subscriptionEvent({ created: 1_000, price: "price_ent" })), "stale");
  assert.equal(dir.writes.length, 0);
});

test("cancelling or an unpaid subscription returns the person to user; past_due keeps the plan", async () => {
  const dir = directory([user("u1", "enterprise", "enterprise"), user("u2", "pro", "pro")]);
  const { billing } = service(dir);
  assert.equal(await billing.handle(subscriptionEvent({ userId: "u2", subscriptionId: "sub_2", status: "past_due", price: "price_pro" })), "unchanged");
  assert.equal(await billing.handle(subscriptionEvent({ type: "customer.subscription.deleted", status: "canceled", price: "price_ent" })), "revoked");
  assert.equal(dir.store.get("u1")?.role, "user");
  assert.equal(dir.store.get("u1")?.appMetadata.plan, null);
  assert.equal(await billing.handle(subscriptionEvent({ userId: "u2", subscriptionId: "sub_2", status: "unpaid", price: "price_pro" })), "revoked");
  assert.equal(dir.store.get("u2")?.role, "user");
});

test("a staff role is never replaced by a plan, and the plan is still recorded", async () => {
  const dir = directory([user("boss", "super_admin")]);
  const { billing, ledger } = service(dir);
  assert.equal(await billing.handle(subscriptionEvent({ userId: "boss" })), "plan_recorded_staff_role_kept");
  assert.equal(dir.store.get("boss")?.role, "super_admin");
  assert.equal(dir.store.get("boss")?.appMetadata.plan, "business");
  assert.equal(await billing.handle(subscriptionEvent({ userId: "boss", type: "customer.subscription.deleted", status: "canceled" })), "revoked");
  assert.equal(dir.store.get("boss")?.role, "super_admin", "cancelling never removes a staff role");
  assert.equal(ledger.list().length, 2);
});

test("events that name no KoreLumina user, an unknown user, an unmapped price or another type change nothing", async () => {
  const dir = directory([user("u1", "user")]);
  const { billing } = service(dir);
  assert.equal(await billing.handle(subscriptionEvent({ userId: null })), "unmatched_user");
  assert.equal(await billing.handle(subscriptionEvent({ userId: "ghost", subscriptionId: "sub_g" })), "unknown_user");
  assert.equal(await billing.handle(subscriptionEvent({ price: "price_other", subscriptionId: "sub_o" })), "unmapped_price");
  assert.equal(await billing.handle({ ...subscriptionEvent({}), type: "invoice.paid" }), "ignored_event_type");
  assert.equal(dir.writes.length, 0);
});

test("when the user directory fails the event is not recorded, so Stripe's retry is handled", async () => {
  const failing = directory([user("u1", "user")], { fail: true });
  const { billing, events } = service(failing);
  const event = subscriptionEvent({ id: "evt_retry" });
  await assert.rejects(billing.handle(event), /user_directory_failed/);
  assert.equal(events.receipt("evt_retry"), null);
});

async function server(billing: StripeBillingService | null, secret: string | undefined) {
  const app = express();
  registerStripeWebhookRoute(app, { secret, billing });
  app.use(express.json());
  const listening = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => listening.once("listening", resolve));
  const { port } = listening.address() as AddressInfo;
  return { url: `http://127.0.0.1:${port}${STRIPE_WEBHOOK_PATH}`, close: () => new Promise((resolve) => listening.close(resolve)) };
}

test("the route refuses unsigned and wrongly signed requests and handles a signed one", async () => {
  const dir = directory([user("u1", "user")]);
  const { billing } = service(dir);
  const running = await server(billing, SECRET);
  try {
    const body = JSON.stringify(subscriptionEvent({ id: "evt_http" }));
    const unsigned = await fetch(running.url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
    assert.equal(unsigned.status, 400);
    const wrong = await fetch(running.url, { method: "POST", headers: { "Content-Type": "application/json", "Stripe-Signature": signStripePayload(body, "whsec_wrong", Math.floor(Date.now() / 1000)) }, body });
    assert.equal(wrong.status, 400);
    assert.equal(dir.writes.length, 0);
    const signed = await fetch(running.url, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8", "Stripe-Signature": signStripePayload(body, SECRET, Math.floor(Date.now() / 1000)) }, body });
    assert.equal(signed.status, 200);
    assert.deepEqual(await signed.json(), { ok: true, outcome: "granted" });
    const replay = await fetch(running.url, { method: "POST", headers: { "Content-Type": "application/json", "Stripe-Signature": signStripePayload(body, SECRET, Math.floor(Date.now() / 1000)) }, body });
    assert.deepEqual(await replay.json(), { ok: true, outcome: "duplicate" });
  } finally {
    await running.close();
  }
});

test("without a signing secret the route answers that billing is not configured", async () => {
  const running = await server(null, undefined);
  try {
    const response = await fetch(running.url, { method: "POST", body: "{}" });
    assert.equal(response.status, 503);
  } finally {
    await running.close();
  }
});

test("the Supabase directory reads one person and writes their plan with the service role key, keeping other app_metadata", async () => {
  const { SupabaseAdminUserDirectory } = await import("../../governance/roles/RoleAssignment.js");
  const calls: Array<{ url: string; method: string; body: unknown; key: string | null }> = [];
  const fakeFetch = (async (url: string, init?: RequestInit) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    calls.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : null, key: headers.apikey ?? null });
    if (url.endsWith("/missing")) return new Response("{}", { status: 404 });
    const app_metadata = init?.body ? JSON.parse(String(init.body)).app_metadata : { role: "user", provider: "email" };
    return new Response(JSON.stringify({ id: "u1", email: "u1@example.com", app_metadata }), { status: 200 });
  }) as typeof fetch;
  const supabase = new SupabaseAdminUserDirectory("https://example.supabase.co", "service-key", fakeFetch);
  assert.equal(await supabase.get("missing"), null);
  const found = await supabase.get("u1");
  assert.ok(found);
  const updated = await supabase.updateAppMetadata(found, { role: "pro", plan: "pro" });
  assert.equal(updated.role, "pro");
  assert.deepEqual(calls[2].body, { app_metadata: { role: "pro", provider: "email", plan: "pro" } });
  assert.equal(calls[2].method, "PUT");
  assert.ok(calls.every((call) => call.key === "service-key"));
});
