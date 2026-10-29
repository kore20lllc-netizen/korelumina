import type { Session as SupabaseSession } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AppError } from "@/lib/errors";
import type {
  AuthProvider,
  Role,
  Session,
  User,
} from "@/providers/types";

function toUser(raw: {
  id: string;
  email?: string;
  created_at?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}): User {
  return {
    id: raw.id,
    email: raw.email ?? "",
    name:
      typeof raw.user_metadata?.name === "string"
        ? raw.user_metadata.name
        : (raw.email ?? "").split("@")[0],
    avatarUrl:
      typeof raw.user_metadata?.avatar_url === "string"
        ? raw.user_metadata.avatar_url
        : undefined,
    /*
     * SEC-1b: the role is read from app_metadata, which only the server
     * (service role) can write. user_metadata is editable by the user
     * themselves, so a role stored there let anyone make themselves admin.
     */
    role:
      typeof raw.app_metadata?.role === "string"
        ? (raw.app_metadata.role as Role)
        : "free",
    createdAt: raw.created_at
      ? new Date(raw.created_at).getTime()
      : Date.now(),
  };
}

type ValidSession = SupabaseSession & { expires_at: number };

function isValidSession(value: unknown): value is ValidSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<SupabaseSession>;
  return typeof session.access_token === "string" && session.access_token.trim().length > 0
    && typeof session.refresh_token === "string" && session.refresh_token.trim().length > 0
    && typeof session.expires_at === "number" && Number.isFinite(session.expires_at) && Number.isFinite(session.expires_at * 1000)
    && session.expires_at * 1000 > Date.now()
    && !!session.user && typeof session.user === "object"
    && typeof session.user.id === "string" && session.user.id.trim().length > 0
    && (session.user.email === undefined || typeof session.user.email === "string")
    && (session.user.created_at === undefined || typeof session.user.created_at === "string");
}

function toSession(raw: ValidSession): Session {
  return { userId: raw.user.id, token: raw.access_token, expiresAt: raw.expires_at * 1000 };
}

function fail(error: { message?: string } | null): never {
  throw new AppError(
    "AUTH_ERROR",
    error?.message || "Authentication request failed.",
  );
}

export class SupabaseAuthProvider implements AuthProvider {
  private snapshot: { session: Session; user: User } | null = null;
  private listeners = new Set<() => void>();
  private expiryTimer: ReturnType<typeof setTimeout> | undefined;
  private pendingRead: Promise<void> | null = null;
  private revision = 0;
  private signedOut = false;
  private unsubscribe: (() => void) | undefined;

  constructor() {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // SDK callbacks must stay synchronous: awaiting another auth call here
      // can deadlock the SDK's session lock.
      if (event === "SIGNED_OUT") this.signedOut = true;
      if (event === "SIGNED_IN") this.signedOut = false;
      this.revision += 1;
      this.publish(this.signedOut ? null : session);
    });
    this.unsubscribe = () => subscription.unsubscribe();
    void this.readSession();
  }

  private publish(value: unknown) {
    if (this.expiryTimer !== undefined) clearTimeout(this.expiryTimer);
    this.expiryTimer = undefined;
    this.snapshot = isValidSession(value)
      ? { session: toSession(value), user: toUser(value.user) }
      : null;
    if (this.snapshot) {
      const delay = Math.min(this.snapshot.session.expiresAt - Date.now(), 2_147_483_647);
      this.expiryTimer = setTimeout(() => {
        if (this.snapshot && this.snapshot.session.expiresAt > Date.now()) {
          this.publish(value);
          return;
        }
        this.publish(null);
        void this.readSession();
      }, Math.max(0, delay));
    }
    this.listeners.forEach((listener) => listener());
  }

  private readSession(): Promise<void> {
    if (!supabase || this.signedOut) return Promise.resolve();
    if (this.pendingRead) return this.pendingRead;
    const revision = this.revision;
    const read = async () => {
      try {
        // getSession joins the configured project's SDK initialization and
        // refresh lock. Never read or delete SDK credentials ourselves.
        const { data, error } = await supabase!.auth.getSession();
        if (revision === this.revision && !this.signedOut) this.publish(error ? null : data.session);
      } catch {
        if (revision === this.revision && !this.signedOut) this.publish(null);
      }
    };
    this.pendingRead = read().finally(() => { this.pendingRead = null; });
    return this.pendingRead;
  }

  private current() {
    if (this.snapshot && this.snapshot.session.expiresAt <= Date.now()) {
      // Reads during render fail closed immediately; defer notifications so
      // subscribers are not updated inside another component's render.
      this.snapshot = null;
      const revision = this.revision;
      queueMicrotask(() => {
        if (!this.snapshot && revision === this.revision) { this.publish(null); void this.readSession(); }
      });
    }
    if (!this.snapshot && !this.signedOut) void this.readSession();
    return this.snapshot;
  }

  getSession(): Session | null {
    return this.current()?.session ?? null;
  }

  getUser(): User | null {
    return this.current()?.user ?? null;
  }

  // Provider owns one SDK subscription and expiry timer; tests/HMR can release it.
  dispose() {
    this.signedOut = true;
    this.revision += 1;
    this.unsubscribe?.();
    if (this.expiryTimer !== undefined) clearTimeout(this.expiryTimer);
    this.listeners.clear();
    this.snapshot = null;
  }

  async signUp({
    email,
    password,
    name,
  }: {
    email: string;
    password: string;
    name: string;
  }) {
    if (!supabase) {
      throw new AppError(
        "AUTH_ERROR",
        "Supabase is not configured.",
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: "free",
        },
      },
    });

    if (error || !data.user || (data.session && !isValidSession(data.session))) fail(error);
    if (data.session) {
      this.signedOut = false;
      this.revision += 1;
      this.publish(data.session);
    }

    return {
      user: toUser(data.user),
      session: isValidSession(data.session)
        ? toSession(data.session)
        : { userId: data.user.id, token: "", expiresAt: Date.now() + 3600_000 },
    };
  }

  async signIn({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    if (!supabase) {
      throw new AppError(
        "AUTH_ERROR",
        "Supabase is not configured.",
      );
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error || !data.user || !isValidSession(data.session)) {
      fail(error);
    }

    this.signedOut = false;
    this.revision += 1;
    this.publish(data.session);
    return {
      user: toUser(data.user),
      session: toSession(data.session),
    };
  }

  async signOut() {
    // Invalidate locally before awaiting network I/O, and reject stale reads
    // or refresh events until a new explicit sign-in.
    this.signedOut = true;
    this.revision += 1;
    this.publish(null);
    try {
      if (!supabase) return;
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) fail(error);
    } finally {
      try {
        // Clear only application identity/navigation keys; the SDK handles
        // its configured project's credentials. Never enumerate auth caches.
        for (const key of ["korelumina:view", "korelumina:activeTeam", "korelumina:role"]) {
          localStorage.removeItem(key);
        }
        sessionStorage.clear();
      } catch { /* Storage may be unavailable. SDK owns its own project keys. */ }
    }
  }

  async resetPassword(email: string) {
    if (!supabase) {
      throw new AppError(
        "AUTH_ERROR",
        "Supabase is not configured.",
      );
    }

    const { error } =
      await supabase.auth.resetPasswordForEmail(email);

    if (error) fail(error);
  }

  async updateProfile(
    patch: Partial<Pick<User, "name" | "avatarUrl">>,
  ) {
    if (!supabase) {
      throw new AppError(
        "AUTH_ERROR",
        "Supabase is not configured.",
      );
    }

    const { data, error } =
      await supabase.auth.updateUser({
        data: {
          name: patch.name,
          avatar_url: patch.avatarUrl,
        },
      });

    if (error || !data.user) fail(error);

    return toUser(data.user);
  }

  async changePassword(
    _oldPassword: string,
    newPassword: string,
  ) {
    if (!supabase) {
      throw new AppError(
        "AUTH_ERROR",
        "Supabase is not configured.",
      );
    }

    const { error } =
      await supabase.auth.updateUser({
        password: newPassword,
      });

    if (error) fail(error);
  }

  /*
   * SEC-1b: a signed-in user cannot change their own role. Roles live in
   * app_metadata and are assigned server-side (ADR-0043, Proposed).
   */
  async setRole(_role: Role): Promise<never> {
    throw new AppError(
      "AUTH_ERROR",
      "Roles are assigned by KoreLumina and cannot be changed from the browser.",
    );
  }

  onChange(callback: () => void) {
    this.listeners.add(callback);
    // Covers a session resolving between a hook's initial read and effect.
    callback();
    return () => { this.listeners.delete(callback); };
  }
}
