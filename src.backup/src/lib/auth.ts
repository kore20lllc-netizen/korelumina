// Thin bridge over the real AuthProvider so existing call sites
// (`isAuthenticated`, `setAuthenticated`, `subscribeAuth`) continue to work
// while data is sourced from providers/registry.
import { auth } from "@/providers/registry";

export function isAuthenticated(): boolean {
  return auth.getSession() !== null;
}

/** Legacy escape hatch — only used by Google-mock continue button. Signs the
 *  user out when false. Cannot create a session here (no credentials); UI
 *  should call auth.signIn / auth.signUp directly. */
export function setAuthenticated(v: boolean) {
  if (!v) void auth.signOut();
  // Notify legacy listeners.
  if (typeof window !== "undefined") window.dispatchEvent(new Event("korelumina:auth-change"));
}

export function subscribeAuth(cb: () => void) {
  const offProvider = auth.onChange(cb);
  const legacy = () => cb();
  if (typeof window !== "undefined") {
    window.addEventListener("korelumina:auth-change", legacy);
    window.addEventListener("storage", legacy);
  }
  return () => {
    offProvider();
    if (typeof window !== "undefined") {
      window.removeEventListener("korelumina:auth-change", legacy);
      window.removeEventListener("storage", legacy);
    }
  };
}