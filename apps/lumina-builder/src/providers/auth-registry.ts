import { SupabaseAuthProvider } from "@/providers/auth/SupabaseAuthProvider";
import type { AuthProvider } from "@/providers/types";

const env =
  (import.meta as {
    env?: Record<string, string | boolean | undefined>;
  }).env ?? {};

if (env.VITE_USE_REAL_AUTH !== "true") {
  throw new Error(
    "[KoreLumina] Real auth is required. Set VITE_USE_REAL_AUTH=true.",
  );
}

if (env.PROD === true && env.VITE_ALLOW_MOCK_PROVIDERS === "true") {
  throw new Error(
    "[KoreLumina] Mock providers are forbidden in production.",
  );
}

export const auth: AuthProvider = new SupabaseAuthProvider();
