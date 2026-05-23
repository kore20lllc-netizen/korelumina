import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { auth } from "@/providers/auth-registry";
import type { User } from "@/providers/types";

type AuthStatus =
  | "loading"
  | "authenticated"
  | "signed_out";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  authenticated: boolean;
}

const AuthCtx = createContext<AuthContextValue | null>(
  null,
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(
    null,
  );

  const [status, setStatus] =
    useState<AuthStatus>("loading");

  useEffect(() => {
    const sync = () => {
      const current = auth.getUser?.() ?? null;

      setUser(current);

      setStatus(
        current
          ? "authenticated"
          : "signed_out",
      );
    };

    sync();

    const off = auth.onChange?.(sync);

    return () => {
      off?.();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      authenticated:
        status === "authenticated",
    }),
    [status, user],
  );

  return (
    <AuthCtx.Provider value={value}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);

  if (!ctx) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return ctx;
}
