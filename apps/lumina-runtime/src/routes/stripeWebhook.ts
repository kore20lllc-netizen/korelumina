import express, { type Express, type Request, type Response } from "express";

import type { StripeBillingService } from "../billing/StripeBilling.js";
import { verifyStripeSignature } from "../billing/StripeSignature.js";

/*
 * MS-2026-0003: Stripe's webhook. Registered before express.json() so the
 * signature is checked against the exact bytes Stripe sent. It needs no
 * session: the signature is the authentication.
 *
 * 400 for anything unsigned or wrongly signed (Stripe does not retry), 503
 * when billing is not configured, 500 when handling fails (Stripe retries),
 * 200 once the event is handled or was already handled.
 */

export const STRIPE_WEBHOOK_PATH = "/api/billing/stripe/webhook";

export function registerStripeWebhookRoute(
  app: Express,
  dependencies: { secret: string | undefined; billing: StripeBillingService | null },
): void {
  app.post(
    STRIPE_WEBHOOK_PATH,
    express.raw({ type: () => true, limit: "1mb" }),
    async (req: Request, res: Response) => {
      if (!dependencies.secret || !dependencies.billing) {
        return res.status(503).json({ ok: false, error: "billing_not_configured" });
      }
      const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      const verified = verifyStripeSignature(body, req.header("stripe-signature"), dependencies.secret);
      if (!verified.ok) return res.status(400).json({ ok: false, error: verified.reason });
      try {
        const outcome = await dependencies.billing.handle(verified.event);
        return res.json({ ok: true, outcome });
      } catch (error) {
        console.error("[billing] stripe event failed", verified.event.id, error instanceof Error ? error.message : error);
        return res.status(500).json({ ok: false, error: "billing_event_failed" });
      }
    },
  );
}
