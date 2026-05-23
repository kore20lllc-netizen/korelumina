import { MockBillingProvider } from "@/providers/billing/MockBillingProvider";
import { StripeBillingProvider } from "@/providers/billing/StripeBillingProvider";
import type { BillingProvider } from "@/providers/types";

const env =
  (import.meta as {
    env?: Record<string, string | boolean | undefined>;
  }).env ?? {};

const isProd =
  env.PROD === true ||
  env.MODE === "production";

const allowMockInProd =
  env.VITE_ALLOW_MOCK_PROVIDERS === "true";

function useRealBilling(): boolean {
  return env.VITE_USE_REAL_BILLING === "true";
}

function createBillingProvider(): BillingProvider {
  const real = useRealBilling();

  if (
    isProd &&
    !real &&
    !allowMockInProd
  ) {
    console.warn(
      "[KoreLumina] Billing provider fallback: MockBillingProvider",
    );
  }

  return real
    ? new StripeBillingProvider()
    : new MockBillingProvider();
}

export const billing = createBillingProvider();
