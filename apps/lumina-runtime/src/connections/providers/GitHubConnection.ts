import type { ConnectionProvider, TokenSet } from "../ConnectionTypes.js";
import { basicAuth, expiresAt, form, providerJson, text } from "./http.js";

/*
 * MS-2026-0016: Continue with GitHub, as a GitHub App's user authorization
 * (web application flow with PKCE). A person without an account can sign
 * up on GitHub's page. Access tokens last 8 hours; refresh tokens 6 months
 * (docs.github.com, "Generating a user access token for a GitHub App").
 * The app is installed only on the repositories the person picks.
 */

const GITHUB = "https://github.com";
const API = "https://api.github.com";

function tokens(data: Record<string, unknown>): TokenSet {
  const accessToken = text(data.access_token);
  if (!accessToken) throw new Error("github_token_missing");
  return {
    accessToken,
    refreshToken: text(data.refresh_token),
    expiresAt: expiresAt(data.expires_in),
    refreshExpiresAt: expiresAt(data.refresh_token_expires_in),
  };
}

export const GitHubConnection: ConnectionProvider = {
  id: "github",
  label: "GitHub",

  authorizeUrl({ config, state, challenge, redirectUri }) {
    const url = new URL(`${GITHUB}/login/oauth/authorize`);
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("allow_signup", "true");
    return url.toString();
  },

  async exchange({ config, code, verifier, redirectUri }) {
    const data = await providerJson(
      `${GITHUB}/login/oauth/access_token`,
      {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
        body: form({ client_id: config.clientId, client_secret: config.clientSecret, code, redirect_uri: redirectUri, code_verifier: verifier }),
      },
      "github_exchange_failed",
    );
    const set = tokens(data);
    const user = await providerJson(
      `${API}/user`,
      { headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${set.accessToken}` } },
      "github_account_unreadable",
    );
    return {
      tokens: set,
      account: { id: text(user.id) ?? "", login: text(user.login) ?? "", name: text(user.name), teamId: null, installationId: null },
    };
  },

  async refresh({ config, refreshToken }) {
    const data = await providerJson(
      `${GITHUB}/login/oauth/access_token`,
      {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
        body: form({ client_id: config.clientId, client_secret: config.clientSecret, grant_type: "refresh_token", refresh_token: refreshToken }),
      },
      "github_refresh_failed",
    );
    return tokens(data);
  },

  async revoke({ config, tokens: set }) {
    try {
      const response = await fetch(`${API}/applications/${encodeURIComponent(config.clientId)}/grant`, {
        method: "DELETE",
        headers: { Accept: "application/vnd.github+json", Authorization: basicAuth(config.clientId, config.clientSecret), "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: set.accessToken }),
      });
      return response.status === 204;
    } catch {
      return false;
    }
  },

  manageUrl() {
    return "https://github.com/settings/apps/authorizations";
  },
};
