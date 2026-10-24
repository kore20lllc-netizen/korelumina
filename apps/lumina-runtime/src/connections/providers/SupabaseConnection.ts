import type { ConnectionProvider, TokenSet } from "../ConnectionTypes.js";
import { basicAuth, expiresAt, form, providerJson, text } from "./http.js";

/*
 * MS-2026-0016: Continue with Supabase, as a Supabase OAuth app with PKCE.
 * The grant gives access to the Management API on the person's behalf,
 * including creating projects in their organisations
 * (supabase.com, "Build a Supabase Integration"). Supabase documents no
 * revocation endpoint: Disconnect deletes KoreLumina's copy and points the
 * person to their Supabase settings to withdraw the grant.
 */

const API = "https://api.supabase.com";

function tokens(data: Record<string, unknown>): TokenSet {
  const accessToken = text(data.access_token);
  if (!accessToken) throw new Error("supabase_token_missing");
  return { accessToken, refreshToken: text(data.refresh_token), expiresAt: expiresAt(data.expires_in), refreshExpiresAt: null };
}

export const SupabaseConnection: ConnectionProvider = {
  id: "supabase",
  label: "Supabase",

  authorizeUrl({ config, state, challenge, redirectUri }) {
    const url = new URL(`${API}/v1/oauth/authorize`);
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
    return url.toString();
  },

  async exchange({ config, code, verifier, redirectUri }) {
    const data = await providerJson(
      `${API}/v1/oauth/token`,
      {
        method: "POST",
        headers: { Accept: "application/json", Authorization: basicAuth(config.clientId, config.clientSecret), "Content-Type": "application/x-www-form-urlencoded" },
        body: form({ grant_type: "authorization_code", code, redirect_uri: redirectUri, code_verifier: verifier }),
      },
      "supabase_exchange_failed",
    );
    const set = tokens(data);
    const organizations = await fetch(`${API}/v1/organizations`, { headers: { Authorization: `Bearer ${set.accessToken}` } })
      .then(async (response) => (response.ok ? ((await response.json()) as Array<{ id?: string; name?: string; slug?: string }>) : []))
      .catch(() => []);
    const first = Array.isArray(organizations) ? organizations[0] : undefined;
    return {
      tokens: set,
      account: {
        id: first?.slug ?? first?.id ?? "",
        login: Array.isArray(organizations) && organizations.length > 1 ? `${first?.name ?? "Supabase"} and ${organizations.length - 1} more` : first?.name ?? "Supabase account",
        name: null,
        teamId: null,
        installationId: null,
      },
    };
  },

  async refresh({ config, refreshToken }) {
    const data = await providerJson(
      `${API}/v1/oauth/token`,
      {
        method: "POST",
        headers: { Accept: "application/json", Authorization: basicAuth(config.clientId, config.clientSecret), "Content-Type": "application/x-www-form-urlencoded" },
        body: form({ grant_type: "refresh_token", refresh_token: refreshToken }),
      },
      "supabase_refresh_failed",
    );
    return tokens(data);
  },

  async revoke() {
    return false;
  },

  manageUrl() {
    return "https://supabase.com/dashboard/account/apps";
  },
};
