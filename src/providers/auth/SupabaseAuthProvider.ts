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
    createdAt: Date.now(),
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
    expiresAt: raw.expires_at
      ? raw.expires_at * 1000
      : Date.now() + 60 * 60 * 1000,
  };
}

function normalizeError(error: { message?: string } | null): never {
  throw new AppError(
    "AUTH_ERROR",
    error?.message || "Authentication request failed.",
  );
}

export class SupabaseAuthProvider implements AuthProvider {
  getSession(): Session | null {
    // Synchronous API required by interface.
    // Runtime state is handled via onChange().
    return null;
  }

  getUser(): User | null {
    return null;
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

    if (error || !data.user) normalizeError(error);

    return {
      user: toUser(data.user),
      session: data.session ? toSession(data.session) : null,
    };
  }

  async signIn({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error || !data.user || !data.session) {
      normalizeError(error);
    }

    return {
      user: toUser(data.user),
      session: toSession(data.session),
    };
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) normalizeError(error);
  }

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
    );
    if (error) normalizeError(error);
  }

  async updateProfile(
    patch: Partial<Pick<User, "name" | "avatarUrl">>,
  ) {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        name: patch.name,
        avatar_url: patch.avatarUrl,
      },
    });

    if (error || !data.user) normalizeError(error);

    return toUser(data.user);
  }

  async changePassword(
    _oldPassword: string,
    newPassword: string,
  ) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) normalizeError(error);
  }

  async setRole(role: Role) {
    const { data, error } = await supabase.auth.updateUser({
      data: { role },
    });

    if (error || !data.user) normalizeError(error);

    return toUser(data.user);
  }

  onChange(callback: () => void) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      callback();
    });

    return () => subscription.unsubscribe();
  }
}
