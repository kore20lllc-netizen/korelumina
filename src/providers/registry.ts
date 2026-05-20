import { MockAuthProvider } from "@/providers/auth/MockAuthProvider";
import { MockBillingProvider } from "@/providers/billing/MockBillingProvider";
import { MockAIProvider } from "@/providers/ai/MockAIProvider";
import { MockRepositoryProvider } from "@/providers/repo/MockRepositoryProvider";
import { MockDeploymentProvider } from "@/providers/deploy/MockDeploymentProvider";
import { LocalStorageProvider } from "@/providers/storage/LocalStorageProvider";
import { MockUsageProvider } from "@/providers/usage/MockUsageProvider";
import { MockTeamProvider } from "@/providers/team/MockTeamProvider";
import { SupabaseTeamProvider } from "@/providers/team/SupabaseTeamProvider";
import { SupabaseAuthProvider } from "@/providers/auth/SupabaseAuthProvider";
import { StripeBillingProvider } from "@/providers/billing/StripeBillingProvider";
import { OpenAIProvider } from "@/providers/ai/OpenAIProvider";
import { GitHubRepositoryProvider } from "@/providers/repo/GitHubRepositoryProvider";
import { VercelDeploymentProvider } from "@/providers/deploy/VercelDeploymentProvider";
import type {
  AIProvider,
  AuthProvider,
  BillingProvider,
  DeploymentProvider,
  RepositoryProvider,
  StorageProvider,
  UsageProvider,
  TeamProvider,
} from "@/providers/types";

type ProviderKey = "auth" | "billing" | "ai" | "repo" | "deploy" | "usage" | "team";
type ProviderMode = "mock" | "real";

declare global {
  interface Window {
    __PROVIDERS__?: Partial<Record<ProviderKey, ProviderMode>>;
  }
}

const env = (import.meta as { env?: Record<string, string | boolean | undefined> }).env ?? {};
const isProd = env.PROD === true || env.MODE === "production";
const allowMockInProd = env.VITE_ALLOW_MOCK_PROVIDERS === "true";

function readEnvFlag(name: string): boolean {
  return env[name] === "true";
}

function readRuntimeOverride(key: ProviderKey): ProviderMode | null {
  if (isProd) return null;
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem("korelumina:v1:providerConfig:config");
    if (raw) {
      const cfg = JSON.parse(raw) as Partial<Record<ProviderKey, ProviderMode>>;
      if (cfg[key] === "mock" || cfg[key] === "real") return cfg[key]!;
    }
  } catch {
    // Ignore invalid local dev overrides.
  }

  const runtime = window.__PROVIDERS__?.[key];
  return runtime === "mock" || runtime === "real" ? runtime : null;
}

function pick(key: ProviderKey, envName: string): ProviderMode {
  const runtimeOverride = readRuntimeOverride(key);
  if (runtimeOverride) return runtimeOverride;

  const mode: ProviderMode = readEnvFlag(envName) ? "real" : "mock";

  if (isProd && mode === "mock" && !allowMockInProd) {
    throw new Error(
      `[KoreLumina] Production boot blocked: ${key} provider resolved to MOCK. ` +
        `Set ${envName}=true or explicitly set VITE_ALLOW_MOCK_PROVIDERS=true for demo-only deployments.`,
    );
  }

  return mode;
}

function selectProviders() {
  return {
    auth: (pick("auth", "VITE_USE_REAL_AUTH") === "real"
      ? new SupabaseAuthProvider()
      : new MockAuthProvider()) as AuthProvider,

    billing: (pick("billing", "VITE_USE_REAL_BILLING") === "real"
      ? new StripeBillingProvider()
      : new MockBillingProvider()) as BillingProvider,

    ai: (pick("ai", "VITE_USE_REAL_AI") === "real"
      ? new OpenAIProvider()
      : new MockAIProvider()) as AIProvider,

    repo: (pick("repo", "VITE_USE_REAL_REPO") === "real"
      ? new GitHubRepositoryProvider()
      : new MockRepositoryProvider()) as RepositoryProvider,

    deploy: (pick("deploy", "VITE_USE_REAL_DEPLOY") === "real"
      ? new VercelDeploymentProvider()
      : new MockDeploymentProvider()) as DeploymentProvider,

    storage: new LocalStorageProvider() as StorageProvider,

    usage: new MockUsageProvider() as UsageProvider,

    team: (pick("team", "VITE_USE_REAL_TEAM") === "real"
      ? new SupabaseTeamProvider()
      : new MockTeamProvider()) as TeamProvider,
  } as const;
}

export const providers = selectProviders();

export const auth = providers.auth;
export const billing = providers.billing;
export const ai = providers.ai;
export const repo = providers.repo;
export const deploy = providers.deploy;
export const storage = providers.storage;
export const usage = providers.usage;
export const team = providers.team;
