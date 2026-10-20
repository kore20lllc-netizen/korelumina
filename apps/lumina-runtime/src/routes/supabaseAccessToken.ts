import crypto from "node:crypto";

/*
 * SEC-1c (ADR-0043 Decision 2): Runtime verifies the Supabase access token
 * the Builder sends, instead of believing role and user headers.
 *
 * Supported signatures, as Supabase issues them:
 * - HS256 with the project's JWT secret (SUPABASE_JWT_SECRET), and
 * - ES256 / RS256 against the project's published signing keys
 *   (SUPABASE_URL + /auth/v1/.well-known/jwks.json).
 *
 * Every other algorithm, "none" included, is refused. A verified token
 * must also be unexpired, issued by this project, and for the
 * "authenticated" audience. The person's role is read from app_metadata,
 * which only the server can write (ADR-0043 Decision 3).
 */

export interface SupabaseTokenConfig {
  url?: string;
  jwtSecret?: string;
}

export interface VerifiedSupabaseIdentity {
  userId: string;
  role: string | null;
  expiresAt: number;
}

export type TokenVerification =
  | { ok: true; identity: VerifiedSupabaseIdentity }
  | { ok: false; reason: string };

type Jwk = crypto.JsonWebKey & { kid?: string; alg?: string };

export type JwksFetcher = (url: string) => Promise<{ keys: Jwk[] }>;

const CLOCK_SKEW_SECONDS = 30;
const JWKS_REUSE_MS = 10 * 60 * 1000;

export function supabaseTokenConfigFromEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): SupabaseTokenConfig {
  return {
    url: (environment.SUPABASE_URL ?? environment.KORELUMINA_SUPABASE_URL)?.trim().replace(/\/+$/, "") || undefined,
    jwtSecret: environment.SUPABASE_JWT_SECRET?.trim() || undefined,
  };
}

function decodeSegment(segment: string): unknown {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
}

const defaultFetcher: JwksFetcher = async (url) => {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`jwks_unavailable:${response.status}`);
  return (await response.json()) as { keys: Jwk[] };
};

export class SupabaseAccessTokenVerifier {
  private jwks: { keys: Jwk[]; fetchedAt: number } | null = null;

  constructor(
    private readonly config: SupabaseTokenConfig,
    private readonly fetchJwks: JwksFetcher = defaultFetcher,
    private readonly now: () => number = () => Date.now(),
  ) {}

  get configured(): boolean {
    return Boolean(this.config.url);
  }

  private async signingKey(kid: string | undefined, refresh = false): Promise<Jwk | null> {
    if (!this.config.url) return null;
    if (refresh || !this.jwks || this.now() - this.jwks.fetchedAt > JWKS_REUSE_MS) {
      const body = await this.fetchJwks(`${this.config.url}/auth/v1/.well-known/jwks.json`);
      this.jwks = { keys: Array.isArray(body?.keys) ? body.keys : [], fetchedAt: this.now() };
    }
    return this.jwks.keys.find((key) => key.kid === kid) ?? null;
  }

  async verify(token: string): Promise<TokenVerification> {
    if (!this.config.url) return { ok: false, reason: "supabase_not_configured" };

    const parts = token.split(".");
    if (parts.length !== 3) return { ok: false, reason: "malformed_token" };
    const [headerPart, payloadPart, signaturePart] = parts;

    let header: { alg?: string; kid?: string };
    let payload: Record<string, unknown>;
    try {
      header = decodeSegment(headerPart) as { alg?: string; kid?: string };
      payload = decodeSegment(payloadPart) as Record<string, unknown>;
    } catch {
      return { ok: false, reason: "malformed_token" };
    }

    const signed = Buffer.from(`${headerPart}.${payloadPart}`);
    const signature = Buffer.from(signaturePart, "base64url");

    try {
      if (header.alg === "HS256") {
        if (!this.config.jwtSecret) return { ok: false, reason: "hs256_secret_not_configured" };
        const expected = crypto.createHmac("sha256", this.config.jwtSecret).update(signed).digest();
        if (expected.length !== signature.length || !crypto.timingSafeEqual(expected, signature)) {
          return { ok: false, reason: "bad_signature" };
        }
      } else if (header.alg === "ES256" || header.alg === "RS256") {
        let jwk = await this.signingKey(header.kid);
        /* A key Supabase rotated in since the last fetch. */
        if (!jwk) jwk = await this.signingKey(header.kid, true);
        if (!jwk) return { ok: false, reason: "unknown_signing_key" };
        const key = crypto.createPublicKey({ key: jwk, format: "jwk" });
        const valid =
          header.alg === "ES256"
            ? crypto.verify("sha256", signed, { key, dsaEncoding: "ieee-p1363" }, signature)
            : crypto.verify("sha256", signed, key, signature);
        if (!valid) return { ok: false, reason: "bad_signature" };
      } else {
        return { ok: false, reason: `algorithm_refused:${header.alg ?? "missing"}` };
      }
    } catch (error) {
      return { ok: false, reason: `verification_failed:${error instanceof Error ? error.message : String(error)}` };
    }

    const nowSeconds = Math.floor(this.now() / 1000);
    const exp = typeof payload.exp === "number" ? payload.exp : null;
    if (exp === null || exp + CLOCK_SKEW_SECONDS < nowSeconds) return { ok: false, reason: "expired" };
    if (typeof payload.nbf === "number" && payload.nbf - CLOCK_SKEW_SECONDS > nowSeconds) {
      return { ok: false, reason: "not_yet_valid" };
    }
    if (payload.iss !== `${this.config.url}/auth/v1`) return { ok: false, reason: "wrong_issuer" };
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audiences.includes("authenticated")) return { ok: false, reason: "wrong_audience" };
    if (typeof payload.sub !== "string" || !payload.sub.trim()) return { ok: false, reason: "missing_subject" };

    const appMetadata =
      payload.app_metadata && typeof payload.app_metadata === "object"
        ? (payload.app_metadata as Record<string, unknown>)
        : {};

    return {
      ok: true,
      identity: {
        userId: payload.sub,
        role: typeof appMetadata.role === "string" ? appMetadata.role : null,
        expiresAt: exp * 1000,
      },
    };
  }
}
