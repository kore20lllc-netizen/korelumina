// Lightweight client-side auth flag used to gate template usage.
// AuthView (sign-in mock) and SettingsView can flip this; signing out clears it.
const KEY = "korelumina:auth";

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setAuthenticated(v: boolean) {
  try {
    if (v) window.localStorage.setItem(KEY, "1");
    else window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("korelumina:auth-change"));
  } catch {}
}

export function subscribeAuth(cb: () => void) {
  const handler = () => cb();
  window.addEventListener("korelumina:auth-change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("korelumina:auth-change", handler);
    window.removeEventListener("storage", handler);
  };
}