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
    role:
      typeof raw.user_metadata?.role === "string"
        ? (raw.user_metadata.role as Role)
        : "free",
    createdAt: raw.created_at
      ? new Date(raw.created_at).getTime()
      : Date.now(),
  };
}

function toSession(raw: {
  access_token: string;
  expires_at?: number;
  user: { id: string };
}): Session {
  return {
    userId: raw.user.id,
    token: raw.access_token,
    expiresAt:
      raw.expires_at
        ? raw.expires_at * 1000
        : Date.now() + 3600_000,
  };
}

function fail(error: { message?: string } | null): never {
  throw new AppError(
    "AUTH_ERROR",
    error?.message || "Authentication request failed.",
  );
}

export class SupabaseAuthProvider implements AuthProvider {
  getSession(): Session | null {
    if (!supabase) {
      return null;
    }

    try {
      const storageKey = Object.keys(localStorage).find(
        (k) => k.startsWith("sb-") && k.endsWith("-auth-token"),
      );

      if (!storageKey) return null;

      const raw = JSON.parse(
        localStorage.getItem(storageKey) || "{}",
      );

      const session = raw?.currentSession ?? raw;

      if (!session?.access_token || !session?.user?.id) {
        return null;
      }

      return toSession(session);
    } catch (error) {
      console.error("[SupabaseAuthProvider] Failed to get session:", error);
      return null;
    }
  }

  getUser(): User | null {
    if (!supabase) {
      return null;
    }

    try {
      const storageKey = Object.keys(localStorage).find(
        (k) => k.startsWith("sb-") && k.endsWith("-auth-token"),
      );

      if (!storageKey) return null;

      const raw = JSON.parse(
        localStorage.getItem(storageKey) || "{}",
      );

      const session = raw?.currentSession ?? raw;
      const user = session?.user;

      if (!user) return null;

      return toUser(user);
    } catch (error) {
      console.error("[SupabaseAuthProvider] Failed to get user:", error);
      return null;
    }
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

    if (error || !data.user) fail(error);

    return {
  user: toUser(data.user),
  session: data.session
    ? toSession(data.session)
    : {
        userId: data.user.id,
        token: "",
        expiresAt: Date.now() + 3600_000,
      },
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

    if (error || !data.user || !data.session) {
      fail(error);
    }

    return {
      user: toUser(data.user),
      session: toSession(data.session),
    };
  }

  async signOut() {
  if (!supabase) return;

  const { error } = await supabase.auth.signOut({
    scope: "global",
  });

  try {
    Object.keys(localStorage).forEach((k) => {
      if (
        k.startsWith("sb-") ||
        k.startsWith("korelumina:")
      ) {
        localStorage.removeItem(k);
      }
    });

    sessionStorage.clear();
  } catch {
    // noop
  }

  if (error) fail(error);
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

  async setRole(role: Role) {
    if (!supabase) {
      throw new AppError(
        "AUTH_ERROR",
        "Supabase is not configured.",
      );
    }

    const { data, error } =
      await supabase.auth.updateUser({
        data: { role },
      });

    if (error || !data.user) fail(error);

    return toUser(data.user);
  }

  onChange(callback: () => void) {
    if (!supabase) {
      return () => {};
    }

    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(() => {
        callback();
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error("[SupabaseAuthProvider] Failed to setup auth listener:", error);
      return () => {};
    }
  }
}
