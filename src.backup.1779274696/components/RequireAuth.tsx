import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useIsAuthenticated } from "@/hooks/use-auth";

const INTENDED_PATH_KEY = "korelumina:intendedPath";

export function rememberIntendedPath(path: string) {
  try { window.sessionStorage.setItem(INTENDED_PATH_KEY, path); } catch {}
}
export function consumeIntendedPath(): string | null {
  try {
    const v = window.sessionStorage.getItem(INTENDED_PATH_KEY);
    if (v) window.sessionStorage.removeItem(INTENDED_PATH_KEY);
    return v;
  } catch { return null; }
}

/** Route-level guard: redirects to "/" (auth-gated landing) when signed-out
 *  and persists the original deep-link path so it can be resumed post-login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const authed = useIsAuthenticated();
  const location = useLocation();
  useEffect(() => {
    if (!authed) rememberIntendedPath(location.pathname + location.search);
  }, [authed, location.pathname, location.search]);
  if (!authed) return <Navigate to="/" replace />;
  return <>{children}</>;
}