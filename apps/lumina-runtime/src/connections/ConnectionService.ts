import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  isNodeTestProcess,
  isolatedTestStorageRoot,
  resolveRepositoryRoot,
} from "../knowledge-preservation/storage/resolveKnowledgeStorageRoot.js";
import { connectionKeyFromEnvironment, openSecret, pkcePair, randomState, sealSecret } from "./ConnectionCrypto.js";
import {
  CONNECTION_PROVIDERS,
  type ConnectedAccount,
  type ConnectionProvider,
  type ConnectionProviderId,
  type ConnectionUse,
  type ProviderConfig,
  type PublicConnection,
  type TokenSet,
} from "./ConnectionTypes.js";
import { GitHubConnection } from "./providers/GitHubConnection.js";
import { SupabaseConnection } from "./providers/SupabaseConnection.js";
import { VercelConnection } from "./providers/VercelConnection.js";

/*
 * MS-2026-0016 (ADR-0047 Decision 1): the customer's connected GitHub,
 * Supabase and Vercel accounts.
 *
 * - Tokens are sealed with the Runtime key (ConnectionCrypto) and kept in
 *   runtime-data, never in git. Without the key nothing is stored.
 * - Only this service opens them, only for an action the person starts,
 *   and every use is appended to the person's use log (who, which
 *   project, which action, when; never a token).
 * - A token that cannot be refreshed marks the connection disconnected;
 *   it is never retried silently.
 * - Disconnect deletes the sealed tokens and asks the provider to withdraw
 *   the access where it can.
 */

export const PROVIDERS: Record<ConnectionProviderId, ConnectionProvider> = {
  github: GitHubConnection,
  supabase: SupabaseConnection,
  vercel: VercelConnection,
};

const ENV: Record<ConnectionProviderId, { id: string; secret: string; slug?: string }> = {
  github: { id: "KORELUMINA_GITHUB_APP_CLIENT_ID", secret: "KORELUMINA_GITHUB_APP_CLIENT_SECRET", slug: "KORELUMINA_GITHUB_APP_SLUG" },
  supabase: { id: "KORELUMINA_SUPABASE_OAUTH_CLIENT_ID", secret: "KORELUMINA_SUPABASE_OAUTH_CLIENT_SECRET" },
  vercel: { id: "KORELUMINA_VERCEL_INTEGRATION_CLIENT_ID", secret: "KORELUMINA_VERCEL_INTEGRATION_CLIENT_SECRET", slug: "KORELUMINA_VERCEL_INTEGRATION_SLUG" },
};

export function providerConfig(provider: ConnectionProviderId, env: NodeJS.ProcessEnv = process.env): ProviderConfig | null {
  const names = ENV[provider];
  const clientId = env[names.id]?.trim();
  const clientSecret = env[names.secret]?.trim();
  const slug = names.slug ? env[names.slug]?.trim() || null : null;
  if (!clientId || !clientSecret) return null;
  if (names.slug && provider === "vercel" && !slug) return null;
  return { clientId, clientSecret, slug };
}

export function resolveConnectionsRoot(): string {
  const configured = process.env.KORELUMINA_CONNECTIONS_DATA_ROOT?.trim();
  if (configured) return path.resolve(configured);
  if (isNodeTestProcess()) return isolatedTestStorageRoot("connections");
  return path.join(resolveRepositoryRoot(), "runtime-data", "connections");
}

interface StoredConnection extends PublicConnection {
  userId: string;
  sealed: string | null;
}

interface PendingAuthorization {
  userId: string;
  provider: ConnectionProviderId;
  verifier: string;
  returnTo: string;
  expires: number;
}

const PENDING_TTL_MS = 10 * 60 * 1000;
const REFRESH_MARGIN_MS = 2 * 60 * 1000;

export class ConnectionError extends Error {}

function userDir(root: string, userId: string): string {
  return path.join(root, crypto.createHash("sha256").update(userId).digest("hex").slice(0, 32));
}

function context(userId: string, provider: ConnectionProviderId): string {
  return `korelumina-connection:${userId}:${provider}`;
}

function publicView(stored: StoredConnection): PublicConnection {
  const { userId: _userId, sealed: _sealed, ...visible } = stored;
  return visible;
}

export class ConnectionService {
  private readonly pending = new Map<string, PendingAuthorization>();

  constructor(
    private readonly deps: {
      root?: () => string;
      key?: () => Buffer | null;
      config?: (provider: ConnectionProviderId) => ProviderConfig | null;
      providers?: Record<ConnectionProviderId, ConnectionProvider>;
      now?: () => number;
    } = {},
  ) {}

  private root(): string {
    return (this.deps.root ?? resolveConnectionsRoot)();
  }

  private key(): Buffer | null {
    return (this.deps.key ?? connectionKeyFromEnvironment)();
  }

  private config(provider: ConnectionProviderId): ProviderConfig | null {
    return (this.deps.config ?? providerConfig)(provider);
  }

  private provider(provider: ConnectionProviderId): ConnectionProvider {
    return (this.deps.providers ?? PROVIDERS)[provider];
  }

  private now(): number {
    return (this.deps.now ?? Date.now)();
  }

  private file(userId: string, provider: ConnectionProviderId): string {
    return path.join(userDir(this.root(), userId), `${provider}.json`);
  }

  private read(userId: string, provider: ConnectionProviderId): StoredConnection | null {
    try {
      return JSON.parse(fs.readFileSync(this.file(userId, provider), "utf8")) as StoredConnection;
    } catch {
      return null;
    }
  }

  private write(stored: StoredConnection): void {
    const file = this.file(stored.userId, stored.provider);
    fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(temp, `${JSON.stringify(stored, null, 2)}\n`, { mode: 0o600 });
    fs.renameSync(temp, file);
  }

  private record(userId: string, use: ConnectionUse): void {
    const file = path.join(userDir(this.root(), userId), "uses.jsonl");
    fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    fs.appendFileSync(file, `${JSON.stringify(use)}\n`, { mode: 0o600 });
  }

  /* Whether connections can work at all, per provider, without revealing any value. */
  readiness(): { storeReady: boolean; providers: Record<ConnectionProviderId, boolean> } {
    return {
      storeReady: this.key() !== null,
      providers: Object.fromEntries(CONNECTION_PROVIDERS.map((id) => [id, this.config(id) !== null])) as Record<ConnectionProviderId, boolean>,
    };
  }

  list(userId: string): Array<{ provider: ConnectionProviderId; label: string; configured: boolean; connection: PublicConnection | null; manageUrl: string | null }> {
    return CONNECTION_PROVIDERS.map((id) => {
      const stored = this.read(userId, id);
      const config = this.config(id);
      return {
        provider: id,
        label: this.provider(id).label,
        configured: config !== null,
        connection: stored ? publicView(stored) : null,
        manageUrl: stored && config ? this.provider(id).manageUrl(stored.account, config) : null,
      };
    });
  }

  uses(userId: string, limit = 50): ConnectionUse[] {
    try {
      return fs
        .readFileSync(path.join(userDir(this.root(), userId), "uses.jsonl"), "utf8")
        .split("\n")
        .filter(Boolean)
        .slice(-limit)
        .map((line) => JSON.parse(line) as ConnectionUse)
        .reverse();
    } catch {
      return [];
    }
  }

  start(userId: string, provider: ConnectionProviderId, redirectUri: string, returnTo: string): string {
    if (!this.key()) throw new ConnectionError("connections_key_missing");
    const config = this.config(provider);
    if (!config) throw new ConnectionError(`provider_not_configured:${provider}`);
    for (const [state, entry] of this.pending) if (entry.expires < this.now()) this.pending.delete(state);
    const state = randomState();
    const { verifier, challenge } = pkcePair();
    this.pending.set(state, { userId, provider, verifier, returnTo, expires: this.now() + PENDING_TTL_MS });
    return this.provider(provider).authorizeUrl({ config, state, challenge, redirectUri });
  }

  /* The provider's redirect: bound to the person only by the state Runtime issued. */
  async complete(
    provider: ConnectionProviderId,
    query: Record<string, string>,
    redirectUri: string,
  ): Promise<{ returnTo: string; connection: PublicConnection }> {
    const entry = query.state ? this.pending.get(query.state) : undefined;
    if (!entry || entry.provider !== provider || entry.expires < this.now()) throw new ConnectionError("connection_state_invalid");
    this.pending.delete(query.state);
    if (!query.code) throw new ConnectionError(query.error ? `connection_declined:${provider}` : "connection_code_missing");
    const key = this.key();
    const config = this.config(provider);
    if (!key) throw new ConnectionError("connections_key_missing");
    if (!config) throw new ConnectionError(`provider_not_configured:${provider}`);

    const { tokens, account } = await this.provider(provider).exchange({ config, code: query.code, verifier: entry.verifier, redirectUri, query });
    const now = this.now();
    const previous = this.read(entry.userId, provider);
    const stored: StoredConnection = {
      provider,
      userId: entry.userId,
      status: "connected",
      account,
      connectedAt: previous?.status === "connected" ? previous.connectedAt : now,
      updatedAt: now,
      expiresAt: tokens.expiresAt,
      disconnectedReason: null,
      sealed: sealSecret(JSON.stringify(tokens), key, context(entry.userId, provider)),
    };
    this.write(stored);
    this.record(entry.userId, { at: now, provider, projectId: null, action: "connect", outcome: "used" });
    return { returnTo: entry.returnTo, connection: publicView(stored) };
  }

  private markDisconnected(stored: StoredConnection, reason: string): void {
    this.write({ ...stored, status: "disconnected", sealed: null, updatedAt: this.now(), disconnectedReason: reason });
  }

  /*
   * The only way to use a connection: for one action the person started,
   * on one project. Refreshes an expiring token first.
   */
  async accessToken(
    userId: string,
    provider: ConnectionProviderId,
    use: { projectId: string | null; action: string },
  ): Promise<{ token: string; account: ConnectedAccount }> {
    const stored = this.read(userId, provider);
    if (!stored || stored.status !== "connected" || !stored.sealed) throw new ConnectionError(`not_connected:${provider}`);
    const key = this.key();
    if (!key) throw new ConnectionError("connections_key_missing");
    let tokens: TokenSet;
    try {
      tokens = JSON.parse(openSecret(stored.sealed, key, context(userId, provider))) as TokenSet;
    } catch {
      this.markDisconnected(stored, "secret_unreadable");
      this.record(userId, { at: this.now(), provider, projectId: use.projectId, action: use.action, outcome: "disconnected" });
      throw new ConnectionError(`connection_lost:${provider}`);
    }

    let outcome: ConnectionUse["outcome"] = "used";
    if (tokens.expiresAt !== null && tokens.expiresAt - REFRESH_MARGIN_MS <= this.now()) {
      const refresh = this.provider(provider).refresh;
      const config = this.config(provider);
      if (!refresh || !tokens.refreshToken || !config || (tokens.refreshExpiresAt !== null && tokens.refreshExpiresAt <= this.now())) {
        this.markDisconnected(stored, "expired");
        this.record(userId, { at: this.now(), provider, projectId: use.projectId, action: use.action, outcome: "disconnected" });
        throw new ConnectionError(`connection_lost:${provider}`);
      }
      try {
        const renewed = await refresh({ config, refreshToken: tokens.refreshToken });
        tokens = { ...renewed, refreshToken: renewed.refreshToken ?? tokens.refreshToken };
        this.write({ ...stored, sealed: sealSecret(JSON.stringify(tokens), key, context(userId, provider)), expiresAt: tokens.expiresAt, updatedAt: this.now() });
        outcome = "refreshed";
      } catch {
        this.markDisconnected(stored, "refresh_refused");
        this.record(userId, { at: this.now(), provider, projectId: use.projectId, action: use.action, outcome: "disconnected" });
        throw new ConnectionError(`connection_lost:${provider}`);
      }
    }

    this.record(userId, { at: this.now(), provider, projectId: use.projectId, action: use.action, outcome });
    return { token: tokens.accessToken, account: stored.account };
  }

  /* A call made with the token was refused by the provider (401/403): the grant was withdrawn. */
  reportRefused(userId: string, provider: ConnectionProviderId, use: { projectId: string | null; action: string }): void {
    const stored = this.read(userId, provider);
    if (stored) this.markDisconnected(stored, "access_withdrawn");
    this.record(userId, { at: this.now(), provider, projectId: use.projectId, action: use.action, outcome: "refused" });
  }

  async disconnect(userId: string, provider: ConnectionProviderId): Promise<{ revokedAtProvider: boolean; manageUrl: string | null }> {
    const stored = this.read(userId, provider);
    if (!stored) return { revokedAtProvider: false, manageUrl: null };
    const key = this.key();
    const config = this.config(provider);
    let revoked = false;
    if (stored.sealed && key && config) {
      try {
        const tokens = JSON.parse(openSecret(stored.sealed, key, context(userId, provider))) as TokenSet;
        revoked = await this.provider(provider).revoke({ config, tokens, account: stored.account });
      } catch {
        revoked = false;
      }
    }
    fs.rmSync(this.file(userId, provider), { force: true });
    this.record(userId, { at: this.now(), provider, projectId: null, action: "disconnect", outcome: "used" });
    return { revokedAtProvider: revoked, manageUrl: config ? this.provider(provider).manageUrl(stored.account, config) : null };
  }
}
