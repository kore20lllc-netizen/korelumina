import { NotImplementedError } from "@/lib/errors";
import type { BillingProvider } from "@/providers/types";

/**
 * Real Stripe adapter. Throws NotImplementedError until wired to live keys
 * + edge functions. Registered behind a feature flag in providers/registry.ts.
 */
export class StripeBillingProvider implements BillingProvider {
  listProducts(): never { throw new NotImplementedError("StripeBillingProvider.listProducts"); }
  getSubscription(): never { throw new NotImplementedError("StripeBillingProvider.getSubscription"); }
  getTeamSubscription(): never { throw new NotImplementedError("StripeBillingProvider.getTeamSubscription"); }
  listPayments(): never { throw new NotImplementedError("StripeBillingProvider.listPayments"); }
  checkout(): never { throw new NotImplementedError("StripeBillingProvider.checkout"); }
  confirmCheckout(): never { throw new NotImplementedError("StripeBillingProvider.confirmCheckout"); }
  cancel(): never { throw new NotImplementedError("StripeBillingProvider.cancel"); }
  reactivate(): never { throw new NotImplementedError("StripeBillingProvider.reactivate"); }
  openPortalUrl(): never { throw new NotImplementedError("StripeBillingProvider.openPortalUrl"); }
}