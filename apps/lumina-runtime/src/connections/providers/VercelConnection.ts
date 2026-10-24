import type { ConnectionProvider } from "../ConnectionTypes.js";
import { form, providerJson, text } from "./http.js";

/*
 * MS-2026-0016: Continue with Vercel, as a Vercel integration. The person
 * installs it on their personal account or a team (signing up first if
 * they have no account); the code in the redirect is exchanged once,
 * within 30 minutes, for a long-lived token that must stay on the server
 * (vercel.com, "Building Integrations with Vercel REST API"). Disconnect
 * uninstalls the integration configuration.
 *
 * Vercel's install page is not an OAuth authorize URL with PKCE; the
 * person is bound to the callback by the state KoreLumina keeps. Whether
 * Vercel passes `state` through is confirmed when the integration is
 * registered; if it does not, the callback is refused, never guessed.
 */

const API = "https://api.vercel.com";

export const VercelConnection: ConnectionProvider = {
  id: "vercel",
  label: "Vercel",

  authorizeUrl({ config, state }) {
    const url = new URL(`https://vercel.com/integrations/${encodeURIComponent(config.slug ?? "")}/new`);
    url.searchParams.set("state", state);
    return url.toString();
  },

  async exchange({ config, code, redirectUri, query }) {
    const data = await providerJson(
      `${API}/v2/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form({ client_id: config.clientId, client_secret: config.clientSecret, code, redirect_uri: redirectUri }),
      },
      "vercel_exchange_failed",
    );
    const accessToken = text(data.access_token);
    if (!accessToken) throw new Error("vercel_token_missing");
    const teamId = text(data.team_id) ?? (query.teamId || null);
    const installationId = text(data.installation_id) ?? (query.configurationId || null);
    const owner = teamId
      ? await providerJson(`${API}/v2/teams/${encodeURIComponent(teamId)}`, { headers: { Authorization: `Bearer ${accessToken}` } }, "vercel_account_unreadable")
      : (((await providerJson(`${API}/v2/user`, { headers: { Authorization: `Bearer ${accessToken}` } }, "vercel_account_unreadable")).user ?? {}) as Record<string, unknown>);
    return {
      tokens: { accessToken, refreshToken: null, expiresAt: null, refreshExpiresAt: null },
      account: {
        id: text(owner.id) ?? text(data.user_id) ?? "",
        login: text(owner.slug) ?? text(owner.username) ?? "",
        name: text(owner.name),
        teamId,
        installationId,
      },
    };
  },

  refresh: null,

  async revoke({ tokens, account }) {
    if (!account.installationId) return false;
    try {
      const scope = account.teamId ? `?teamId=${encodeURIComponent(account.teamId)}` : "";
      const response = await fetch(`${API}/v1/integrations/configuration/${encodeURIComponent(account.installationId)}${scope}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  manageUrl(account) {
    return account.teamId ? "https://vercel.com/dashboard/integrations" : "https://vercel.com/account/integrations";
  },
};
