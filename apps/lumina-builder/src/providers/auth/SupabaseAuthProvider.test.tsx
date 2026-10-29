import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient, type Session as SupabaseSession } from "@supabase/supabase-js";

const sdk = vi.hoisted(() => ({
  getSession: vi.fn(), onAuthStateChange: vi.fn(), signOut: vi.fn(),
  signInWithPassword: vi.fn(), signUp: vi.fn(), resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(), client: null as unknown,
  active: null as { getUser: () => unknown; onChange: (cb: () => void) => () => void } | null,
}));
vi.mock("@/integrations/supabase/client", () => ({ get supabase() { return sdk.client; } }));
vi.mock("@/providers/auth-registry", () => ({ auth: {
  getUser: () => sdk.active?.getUser() ?? null,
  onChange: (callback: () => void) => sdk.active?.onChange(callback) ?? (() => {}),
} }));
import { SupabaseAuthProvider } from "./SupabaseAuthProvider";
import { RequireAuth } from "@/components/RequireAuth";
import { useIsAuthenticated } from "@/hooks/use-auth";
import { getCapabilities, getCurrentRole } from "@/services/workspaceAccessService";

const user = { id: "fixture-user", email: "fixture@example.invalid", created_at: "2026-01-01", app_metadata: { role: "business" }, user_metadata: { role: "super_admin" } };
const session = (patch: Record<string, unknown> = {}) => ({
  access_token: "isolated-access-token", refresh_token: "isolated-refresh-token",
  expires_at: Math.floor(Date.now() / 1000) + 3600, user, ...patch,
} as unknown as SupabaseSession);
const response = (value: unknown, error: unknown = null) => ({ data: { session: value }, error });
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
};
let event: (type: string, value: unknown) => void;
let providers: SupabaseAuthProvider[];
const create = () => {
  const provider = new SupabaseAuthProvider(); providers.push(provider); sdk.active = provider; return provider;
};
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
const storage = () => {
  const values: Record<string, string> = {};
  return { getItem: (key: string) => values[key] ?? null,
    setItem: (key: string, value: string) => { values[key] = value; },
    removeItem: (key: string) => { delete values[key]; },
    clear: () => { for (const key of Object.keys(values)) delete values[key]; } };
};
function Probe() { return <div>{useIsAuthenticated() ? "authenticated" : "signed out"}</div>; }
function Guard() {
  return <MemoryRouter initialEntries={["/protected"]}><Routes>
    <Route path="/" element={<div>sign in</div>} />
    <Route path="/protected" element={<RequireAuth><div>protected content</div></RequireAuth>} />
  </Routes></MemoryRouter>;
}

beforeEach(() => {
  vi.resetAllMocks(); providers = []; sdk.active = null;
  vi.stubGlobal("localStorage", storage()); vi.stubGlobal("sessionStorage", storage());
  sdk.client = { auth: sdk };
  sdk.getSession.mockResolvedValue(response(null));
  sdk.signOut.mockResolvedValue({ error: null });
  sdk.onAuthStateChange.mockImplementation((callback) => {
    event = callback; return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
});
afterEach(() => { providers.forEach(p => p.dispose()); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("SDK-managed cached-session validity", () => {
  it("fails closed until SDK initialization resolves, then publishes a valid session", async () => {
    const read = deferred<ReturnType<typeof response>>(); sdk.getSession.mockReturnValue(read.promise);
    const provider = create(); const listener = vi.fn(); provider.onChange(listener);
    expect(provider.getSession()).toBeNull(); expect(provider.getUser()).toBeNull();
    read.resolve(response(session())); await flush();
    expect(provider.getSession()?.token).toBe("isolated-access-token");
    expect(provider.getUser()?.id).toBe(user.id); expect(listener).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["expired with refresh", { expires_at: 1 }],
    ["expired without refresh", { expires_at: 1, refresh_token: undefined }],
    ["no access token", { access_token: undefined }],
    ["empty access token", { access_token: " " }],
    ["no expiry", { expires_at: undefined }],
    ["invalid expiry", { expires_at: "future" }],
    ["infinite expiry", { expires_at: Infinity }],
    ["missing user", { user: null }],
    ["invalid user", { user: {} }],
    ["invalid email", { user: { ...user, email: 12 } }],
  ])("rejects %s", async (_label, patch) => {
    sdk.getSession.mockResolvedValue(response(session(patch))); const provider = create(); await flush();
    expect(provider.getUser()).toBeNull(); expect(provider.getSession()).toBeNull();
  });

  it("denies a missing session and an unavailable configured client", async () => {
    const provider = create(); await flush(); expect(provider.getUser()).toBeNull();
    sdk.client = null; const unavailable = create(); expect(unavailable.getSession()).toBeNull();
  });

  it("ignores foreign-project and malformed browser storage and leaves credentials intact", async () => {
    localStorage.setItem("sb-foreign-auth-token", JSON.stringify(session()));
    localStorage.setItem("sb-malformed-auth-token", "{not JSON");
    const provider = create(); await flush(); expect(provider.getUser()).toBeNull();
    expect(localStorage.getItem("sb-foreign-auth-token")).toBeTruthy();
    expect(localStorage.getItem("sb-malformed-auth-token")).toBe("{not JSON");
  });

  it("joins unresolved SDK reads and accepts refreshed state without exposing expired credentials", async () => {
    const read = deferred<ReturnType<typeof response>>(); sdk.getSession.mockReturnValue(read.promise);
    const provider = create();
    for (let i = 0; i < 30; i++) { expect(provider.getUser()).toBeNull(); expect(provider.getSession()).toBeNull(); }
    expect(sdk.getSession).toHaveBeenCalledTimes(1);
    event("TOKEN_REFRESHED", session({ access_token: "refreshed" }));
    read.resolve(response(session({ expires_at: 1 }))); await flush();
    expect(provider.getSession()?.token).toBe("refreshed");
  });

  it("fails closed on refresh error while retaining SDK credentials for a later successful retry", async () => {
    localStorage.setItem("sb-configured-auth-token", "sdk-owned-refresh-credentials");
    sdk.getSession.mockRejectedValueOnce(new Error("offline"));
    const provider = create(); await flush(); expect(provider.getUser()).toBeNull();
    expect(localStorage.getItem("sb-configured-auth-token")).toBe("sdk-owned-refresh-credentials");
    sdk.getSession.mockResolvedValue(response(session()));
    await flush(); provider.getSession(); await flush();
    expect(provider.getUser()?.id).toBe(user.id);
  });

  it("removes protected content at expiry and restores authenticated hook state after refresh", async () => {
    vi.useFakeTimers(); sdk.getSession.mockResolvedValue(response(session({ expires_at: Date.now() / 1000 + 1 })));
    const provider = create(); await flush();
    expect(renderToString(<Guard />)).toContain("protected content");
    const refresh = deferred<ReturnType<typeof response>>(); sdk.getSession.mockReturnValue(refresh.promise);
    vi.advanceTimersByTime(1001); await flush();
    expect(renderToString(<Guard />)).not.toContain("protected content"); expect(provider.getSession()).toBeNull();
    refresh.resolve(response(session())); await flush();
    expect(renderToString(<Probe />)).toContain("authenticated");
  });

  it("keeps the real guard hidden during unresolved and malformed authentication", async () => {
    const read = deferred<ReturnType<typeof response>>(); sdk.getSession.mockReturnValue(read.promise);
    create(); expect(renderToString(<Guard />)).not.toContain("protected content");
    read.resolve(response(session({ user: {} }))); await flush();
    expect(renderToString(<Guard />)).not.toContain("protected content");
  });

  it("invalidates consumers on SIGNED_OUT and ignores a stale pending read", async () => {
    const read = deferred<ReturnType<typeof response>>(); sdk.getSession.mockReturnValue(read.promise);
    const provider = create(); const changes: boolean[] = [];
    provider.onChange(() => changes.push(!!provider.getUser()));
    event("SIGNED_IN", session());
    expect(changes.at(-1)).toBe(true);
    event("SIGNED_OUT", null);
    read.resolve(response(session())); await flush();
    expect(provider.getUser()).toBeNull(); expect(changes.at(-1)).toBe(false);
  });

  it("signs out immediately, preserves foreign credentials and blocks late refresh resurrection", async () => {
    sdk.getSession.mockResolvedValue(response(session())); const provider = create(); await flush();
    localStorage.setItem("sb-foreign-auth-token", "foreign");
    const logout = deferred<{ error: null }>(); sdk.signOut.mockReturnValue(logout.promise);
    const pending = provider.signOut(); expect(provider.getUser()).toBeNull();
    event("TOKEN_REFRESHED", session()); expect(provider.getUser()).toBeNull();
    logout.resolve({ error: null }); await pending;
    expect(sdk.signOut).toHaveBeenCalledWith({ scope: "global" });
    expect(localStorage.getItem("sb-foreign-auth-token")).toBe("foreign");
  });

  it("remains locally signed out if SDK logout throws, and supports a subsequent explicit sign-in", async () => {
    sdk.getSession.mockResolvedValue(response(session())); const provider = create(); await flush();
    sdk.signOut.mockRejectedValue(new Error("offline")); await expect(provider.signOut()).rejects.toThrow("offline");
    expect(provider.getSession()).toBeNull();
    sdk.signInWithPassword.mockResolvedValue({ data: { user, session: session() }, error: null });
    await provider.signIn({ email: user.email, password: "fixture" }); expect(provider.getUser()?.id).toBe(user.id);
  });

  it("does not lose a resolved session between a hook's render and subscription", async () => {
    const provider = create(); await flush(); event("SIGNED_IN", session());
    const listener = vi.fn(); provider.onChange(listener); expect(listener).toHaveBeenCalledTimes(1);
    expect(provider.getUser()?.id).toBe(user.id);
  });

  it("does not publish an email-confirmation signup as authenticated", async () => {
    const provider = create(); await flush();
    sdk.signUp.mockResolvedValue({ data: { user, session: null }, error: null });
    const result = await provider.signUp({ email: user.email, password: "fixture", name: "Fixture" });
    expect(result.session.token).toBe(""); expect(provider.getUser()).toBeNull();
  });

  it("preserves password recovery and profile update calls", async () => {
    const provider = create(); await flush();
    sdk.resetPasswordForEmail.mockResolvedValue({ error: null });
    await provider.resetPassword(user.email);
    expect(sdk.resetPasswordForEmail).toHaveBeenCalledWith(user.email);
    sdk.updateUser.mockResolvedValue({ data: { user }, error: null });
    await provider.updateProfile({ name: "Fixture", avatarUrl: "https://fixture.invalid/avatar" });
    expect(sdk.updateUser).toHaveBeenCalledWith({ data: { name: "Fixture", avatar_url: "https://fixture.invalid/avatar" } });
    await provider.changePassword("old", "new");
    expect(sdk.updateUser).toHaveBeenCalledWith({ password: "new" });
  });

  it("does not overwrite a refresh event with a deferred expiry notification", async () => {
    vi.useFakeTimers(); sdk.getSession.mockResolvedValue(response(session({ expires_at: Date.now() / 1000 + 1 })));
    const provider = create(); await flush();
    vi.setSystemTime(Date.now() + 2000);
    expect(provider.getUser()).toBeNull();
    event("TOKEN_REFRESHED", session({ access_token: "newer-session" }));
    await flush(); expect(provider.getSession()?.token).toBe("newer-session");
  });

  it("preserves server metadata roles, capability mapping and role-change refusal", async () => {
    sdk.getSession.mockResolvedValue(response(session())); const provider = create(); await flush();
    expect(provider.getUser()?.role).toBe("business"); expect(getCurrentRole()).toBe("business");
    expect(getCapabilities(getCurrentRole()).adminTools).toBe(false);
    await expect(provider.setRole("admin")).rejects.toThrow("cannot be changed");
  });
});


describe("installed Supabase SDK refresh coordination", () => {
  it("shares a real SDK refresh and never exposes the expired cached session", async () => {
    const store = storage(); const key = "sb-configured-fixture-auth-token";
    store.setItem(key, JSON.stringify(session({ expires_at: 1 })));
    store.setItem("sb-foreign-auth-token", JSON.stringify(session({ user: { ...user, id: "foreign" } })));
    const refresh = deferred<Response>(); const fetcher = vi.fn(() => refresh.promise);
    const client = createClient("https://session-fixture.invalid", "fixture-public-key", {
      auth: { storage: store, storageKey: key, persistSession: true, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: fetcher },
    });
    await client.auth.initialize(); sdk.client = client;
    const provider = create();
    const parallel = Array.from({ length: 12 }, () => client.auth.getSession());
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    expect(provider.getUser()).toBeNull(); expect(provider.getSession()).toBeNull();
    refresh.resolve(new Response(JSON.stringify({ ...session({ access_token: "sdk-refreshed" }), expires_in: 3600, token_type: "bearer" }), { status: 200, headers: { "content-type": "application/json" } }));
    await Promise.all(parallel);
    await vi.waitFor(() => expect(provider.getSession()?.token).toBe("sdk-refreshed"));
    expect(provider.getUser()?.id).toBe(user.id);
    expect(store.getItem("sb-foreign-auth-token")).toBeTruthy();
    client.auth.stopAutoRefresh();
  });

  it("follows the SDK's cache invalidation after a definitive refresh rejection", async () => {
    const store = storage(); const key = "sb-rejected-fixture-auth-token";
    store.setItem(key, JSON.stringify(session({ expires_at: 1 })));
    const client = createClient("https://rejected-fixture.invalid", "fixture-public-key", {
      auth: { storage: store, storageKey: key, persistSession: true, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: async () => new Response(JSON.stringify({ msg: "Fixture refresh rejected" }), { status: 400, headers: { "content-type": "application/json" } }) },
    });
    await client.auth.initialize(); sdk.client = client;
    const provider = create(); const changed = vi.fn(); provider.onChange(changed);
    await vi.waitFor(() => expect(store.getItem(key)).toBeNull());
    expect(provider.getUser()).toBeNull(); expect(provider.getSession()).toBeNull();
    expect(changed).toHaveBeenCalled(); client.auth.stopAutoRefresh();
  });

  it("lets the configured SDK sign out without deleting another project's cache", async () => {
    const store = storage(); const key = "sb-logout-fixture-auth-token";
    store.setItem(key, JSON.stringify(session())); store.setItem("sb-other-auth-token", "foreign");
    const client = createClient("https://logout-fixture.invalid", "fixture-public-key", {
      auth: { storage: store, storageKey: key, persistSession: true, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: async () => new Response(null, { status: 204 }) },
    });
    await client.auth.initialize(); sdk.client = client;
    const provider = create(); await vi.waitFor(() => expect(provider.getUser()?.id).toBe(user.id));
    await provider.signOut(); expect(store.getItem(key)).toBeNull();
    expect(provider.getUser()).toBeNull(); expect(store.getItem("sb-other-auth-token")).toBe("foreign");
    client.auth.stopAutoRefresh();
  });
});
