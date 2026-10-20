import { MockAuthProvider } from "@/providers/auth/MockAuthProvider";
import { SupabaseAuthProvider } from "@/providers/auth/SupabaseAuthProvider";
import type { AuthProvider } from "@/providers/types";

const env =
  (import.meta as {
    env?: Record<string, string | boolean | undefined>;
  }).env ?? {};

const isProduction =
  env.PROD === true ||
  env.MODE === "production";

const useRealAuth =
  env.VITE_USE_REAL_AUTH === "true";

const allowMockProviders =
  env.VITE_ALLOW_MOCK_PROVIDERS === "true";

if (isProduction && !useRealAuth) {
  throw new Error(
    "[KoreLumina] Real auth is required in production. Set VITE_USE_REAL_AUTH=true.",
  );
}

if (isProduction && allowMockProviders) {
  throw new Error(
    "[KoreLumina] Mock providers are forbidden in production.",
  );
}

/*
 * SEC-1d (ADR-0043): with real sign-in the Builder proves who the person
 * is with their session token; Runtime verifies it.
 */
export const usesVerifiedSessions: boolean = useRealAuth;

export const auth: AuthProvider = useRealAuth
  ? new SupabaseAuthProvider()
  : new MockAuthProvider();
