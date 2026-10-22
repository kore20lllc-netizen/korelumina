import fs from "node:fs";
import path from "node:path";

import { PLAN_ROLES, STAFF_ROLES, type DirectoryUser } from "../governance/roles/RoleAssignment.js";
import {
  isNodeTestProcess,
  isolatedTestStorageRoot,
  resolveRepositoryRoot,
} from "../knowledge-preservation/storage/resolveKnowledgeStorageRoot.js";
import type { StripeEvent } from "./StripeSignature.js";

/*
 * MS-2026-0003 (ADR-0043 Decision 3): a paid plan grants its role only
 * through Stripe's verified webhook.
 *
 * - The plan comes from the subscription's price, mapped by the owner in
 *   Runtime's environment (STRIPE_PRICE_PRO, _BUSINESS, _ENTERPRISE).
 * - The person comes from subscription.metadata.korelumina_user_id, set by
 *   KoreLumina when it creates the subscription. Nothing in the event is
 *   trusted to name a role.
 * - A staff role (inhouse-dev, admin, super_admin) is never replaced by a
 *   plan; the plan is still recorded beside it.
 * - Every event is processed once, and an event older than the last one
 *   applied to the same subscription changes nothing, because Stripe does
 *   not guarantee delivery order.
 * - Every role change is a committed governance record (who, from, to,
 *   which event, when). Event receipts stay in runtime-data.
 */

export type Plan = (typeof PLAN_ROLES)[number];

export const SUBSCRIPTION_EVENTS = [
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
] as const;

/* past_due keeps the plan while Stripe retries the payment. */
export const GRANTING_STATUSES: ReadonlySet<string> = new Set(["active", "trialing", "past_due"]);

export const USER_METADATA_KEY = "korelumina_user_id";

export type PriceMap = ReadonlyMap<string, Plan>;

export function priceMapFromEnvironment(env: NodeJS.ProcessEnv = process.env): PriceMap {
  const map = new Map<string, Plan>();
  const sources: Array<[Plan, string | undefined]> = [
    ["pro", env.STRIPE_PRICE_PRO],
    ["business", env.STRIPE_PRICE_BUSINESS],
    ["enterprise", env.STRIPE_PRICE_ENTERPRISE],
  ];
  for (const [plan, value] of sources) {
    for (const priceId of (value ?? "").split(",").map((entry) => entry.trim()).filter(Boolean)) {
      if (map.has(priceId) && map.get(priceId) !== plan) throw new Error(`stripe_price_mapped_twice:${priceId}`);
      map.set(priceId, plan);
    }
  }
  return map;
}

const RANK: Record<Plan, number> = { pro: 1, business: 2, enterprise: 3 };

/* The highest plan among the subscription's prices, or null if none is mapped. */
export function planOfSubscription(subscription: Record<string, any>, prices: PriceMap): Plan | null {
  const items: any[] = Array.isArray(subscription?.items?.data) ? subscription.items.data : [];
  let best: Plan | null = null;
  for (const item of items) {
    const priceId = typeof item?.price?.id === "string" ? item.price.id : typeof item?.price === "string" ? item.price : null;
    const plan = priceId ? prices.get(priceId) ?? null : null;
    if (plan && (!best || RANK[plan] > RANK[best])) best = plan;
  }
  return best;
}

export interface PlanDirectory {
  readonly configured: boolean;
  get(userId: string): Promise<DirectoryUser | null>;
  updateAppMetadata(user: DirectoryUser, patch: Record<string, unknown>): Promise<DirectoryUser>;
}

export type BillingOutcome =
  | "granted"
  | "revoked"
  | "plan_recorded_staff_role_kept"
  | "unchanged"
  | "duplicate"
  | "stale"
  | "ignored_event_type"
  | "unmatched_user"
  | "unknown_user"
  | "unmapped_price";

export interface StripeEventReceipt {
  eventId: string;
  type: string;
  created: number;
  livemode: boolean;
  subscriptionId: string | null;
  userId: string | null;
  outcome: BillingOutcome;
  receivedAt: string;
}

export interface PlanAssignmentRecord {
  id: string;
  userId: string;
  fromRole: string | null;
  toRole: string | null;
  fromPlan: string | null;
  toPlan: Plan | null;
  subscriptionId: string;
  subscriptionStatus: string;
  eventId: string;
  eventType: string;
  livemode: boolean;
  assignedBy: "system:stripe";
  assignedAt: string;
}

function storageRoot(envKey: string, testName: string, fallback: string[]): () => string {
  return () => {
    const configured = process.env[envKey]?.trim();
    if (configured) return path.resolve(configured);
    if (isNodeTestProcess()) return isolatedTestStorageRoot(testName);
    return path.join(resolveRepositoryRoot(), ...fallback);
  };
}

export const resolveBillingDataRoot = storageRoot("KORELUMINA_BILLING_DATA_ROOT", "billing-data", ["runtime-data", "billing"]);
export const resolvePlanAssignmentRoot = storageRoot("KORELUMINA_PLAN_ASSIGNMENT_ROOT", "plan-assignments", ["runtime", "governance", "plan-assignments"]);

const safe = (value: string) => value.replace(/[^A-Za-z0-9_-]/g, "_");

/* Receipts of processed events, and the newest event applied per subscription. */
export class FileStripeEventStore {
  constructor(private readonly root: () => string = resolveBillingDataRoot) {}

  private file(...parts: string[]): string {
    return path.join(this.root(), ...parts);
  }

  receipt(eventId: string): StripeEventReceipt | null {
    const file = this.file("events", `${safe(eventId)}.json`);
    return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as StripeEventReceipt) : null;
  }

  record(receipt: StripeEventReceipt): void {
    const file = this.file("events", `${safe(receipt.eventId)}.json`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    try {
      fs.writeFileSync(file, `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
  }

  lastApplied(subscriptionId: string): number | null {
    const file = this.file("subscriptions", `${safe(subscriptionId)}.json`);
    if (!fs.existsSync(file)) return null;
    const value = JSON.parse(fs.readFileSync(file, "utf8")) as { lastEventCreated?: number };
    return typeof value.lastEventCreated === "number" ? value.lastEventCreated : null;
  }

  markApplied(subscriptionId: string, eventId: string, created: number): void {
    const file = this.file("subscriptions", `${safe(subscriptionId)}.json`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify({ subscriptionId, lastEventId: eventId, lastEventCreated: created }, null, 2)}\n`);
  }
}

export class FilePlanAssignmentLedger {
  constructor(private readonly root: () => string = resolvePlanAssignmentRoot) {}

  record(record: PlanAssignmentRecord): void {
    const root = this.root();
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(
      path.join(root, `${record.assignedAt.replace(/[:.]/g, "-")}-${safe(record.eventId)}.json`),
      `${JSON.stringify(record, null, 2)}\n`,
      { flag: "wx" },
    );
  }

  list(): PlanAssignmentRecord[] {
    const root = this.root();
    if (!fs.existsSync(root)) return [];
    return fs
      .readdirSync(root)
      .filter((name) => name.endsWith(".json"))
      .sort()
      .map((name) => JSON.parse(fs.readFileSync(path.join(root, name), "utf8")) as PlanAssignmentRecord);
  }
}

const isPlan = (value: unknown): value is Plan => typeof value === "string" && (PLAN_ROLES as readonly string[]).includes(value);
const isStaffAboveUser = (value: unknown) => typeof value === "string" && value !== "user" && (STAFF_ROLES as readonly string[]).includes(value);

export class StripeBillingService {
  constructor(
    private readonly directory: PlanDirectory,
    private readonly events: FileStripeEventStore,
    private readonly ledger: FilePlanAssignmentLedger,
    private readonly prices: PriceMap,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /*
   * Throws when the user directory fails, so the route answers 500 and
   * Stripe retries; the event is recorded only once it is handled.
   */
  async handle(event: StripeEvent): Promise<BillingOutcome> {
    if (this.events.receipt(event.id)) return "duplicate";

    const receipt = (outcome: BillingOutcome, subscriptionId: string | null, userId: string | null): BillingOutcome => {
      this.events.record({
        eventId: event.id,
        type: event.type,
        created: event.created,
        livemode: event.livemode === true,
        subscriptionId,
        userId,
        outcome,
        receivedAt: this.now().toISOString(),
      });
      return outcome;
    };

    if (!(SUBSCRIPTION_EVENTS as readonly string[]).includes(event.type)) return receipt("ignored_event_type", null, null);

    const subscription = event.data.object;
    const subscriptionId = typeof subscription.id === "string" ? subscription.id : null;
    if (!subscriptionId) return receipt("ignored_event_type", null, null);
    const userId = typeof subscription.metadata?.[USER_METADATA_KEY] === "string" ? subscription.metadata[USER_METADATA_KEY].trim() : "";
    if (!userId) return receipt("unmatched_user", subscriptionId, null);

    const last = this.events.lastApplied(subscriptionId);
    if (last !== null && event.created < last) return receipt("stale", subscriptionId, userId);

    const status = String(subscription.status ?? "");
    const granting = event.type !== "customer.subscription.deleted" && GRANTING_STATUSES.has(status);
    const plan = granting ? planOfSubscription(subscription, this.prices) : null;
    if (granting && !plan) return receipt("unmapped_price", subscriptionId, userId);

    if (!this.directory.configured) throw new Error("user_directory_not_configured");
    const user = await this.directory.get(userId);
    if (!user) return receipt("unknown_user", subscriptionId, userId);

    const fromRole = user.role;
    const fromPlan = isPlan(user.appMetadata.plan) ? user.appMetadata.plan : null;
    let toRole: string | null = fromRole;
    let outcome: BillingOutcome;
    if (plan) {
      if (isStaffAboveUser(fromRole)) {
        outcome = "plan_recorded_staff_role_kept";
      } else {
        toRole = plan;
        outcome = "granted";
      }
    } else {
      if (isPlan(fromRole)) toRole = "user";
      outcome = "revoked";
    }

    if (toRole === fromRole && plan === fromPlan) {
      this.events.markApplied(subscriptionId, event.id, event.created);
      return receipt("unchanged", subscriptionId, userId);
    }

    await this.directory.updateAppMetadata(user, { role: toRole, plan });
    const assignedAt = this.now().toISOString();
    this.ledger.record({
      id: `plan-assignment:${assignedAt}:${userId}`,
      userId,
      fromRole,
      toRole,
      fromPlan,
      toPlan: plan,
      subscriptionId,
      subscriptionStatus: status,
      eventId: event.id,
      eventType: event.type,
      livemode: event.livemode === true,
      assignedBy: "system:stripe",
      assignedAt,
    });
    this.events.markApplied(subscriptionId, event.id, event.created);
    return receipt(outcome, subscriptionId, userId);
  }
}
