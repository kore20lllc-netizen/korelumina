/* MS-2026-0016: the shapes shared by the connection store and its providers. */

export type ConnectionProviderId = "github" | "supabase" | "vercel";

export const CONNECTION_PROVIDERS: ConnectionProviderId[] = ["github", "supabase", "vercel"];

export interface ConnectedAccount {
  id: string;
  login: string;
  name: string | null;
  /* Vercel: the team the integration was installed on; null for a personal account. */
  teamId: string | null;
  /* Vercel: the integration configuration (icfg_...), needed to uninstall. */
  installationId: string | null;
}

export interface TokenSet {
  accessToken: string;
  refreshToken: string | null;
  /* Epoch milliseconds; null when the token does not expire. */
  expiresAt: number | null;
  refreshExpiresAt: number | null;
}

/* What is safe to show anyone who may see the connection: never a token. */
export interface PublicConnection {
  provider: ConnectionProviderId;
  status: "connected" | "disconnected";
  account: ConnectedAccount;
  connectedAt: number;
  updatedAt: number;
  expiresAt: number | null;
  disconnectedReason: string | null;
}

export interface ConnectionUse {
  at: number;
  provider: ConnectionProviderId;
  projectId: string | null;
  action: string;
  outcome: "used" | "refreshed" | "refused" | "disconnected";
}

export interface ProviderConfig {
  clientId: string;
  clientSecret: string;
  /* GitHub App or Vercel integration slug, for their install pages. */
  slug: string | null;
}

export interface ConnectionProvider {
  id: ConnectionProviderId;
  label: string;
  /* The page the person is sent to, to sign in (or sign up) and grant access. */
  authorizeUrl(input: { config: ProviderConfig; state: string; challenge: string; redirectUri: string }): string;
  /* Exchanges the code from the callback for tokens and reads whose account it is. */
  exchange(input: {
    config: ProviderConfig;
    code: string;
    verifier: string;
    redirectUri: string;
    query: Record<string, string>;
  }): Promise<{ tokens: TokenSet; account: ConnectedAccount }>;
  /* Null when the provider's tokens do not expire. */
  refresh: ((input: { config: ProviderConfig; refreshToken: string }) => Promise<TokenSet>) | null;
  /* Best effort: asks the provider to withdraw KoreLumina's access. */
  revoke(input: { config: ProviderConfig; tokens: TokenSet; account: ConnectedAccount }): Promise<boolean>;
  /* Where the person can see or withdraw the access themselves. */
  manageUrl(account: ConnectedAccount, config: ProviderConfig): string;
}
