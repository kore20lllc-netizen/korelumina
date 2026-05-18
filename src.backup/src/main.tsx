import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { runSeed } from "@/lib/seed";
import { runMigrations } from "@/lib/persistence";
import { applyConfigToRuntime } from "@/services/providerConfigService";

const STORAGE_KEY = "lumina:lastError";

if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = () => ({
    matches: false,
    media: "",
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
}

const recordError = (err: unknown) => {
  try {
    const e = err as { message?: string; stack?: string } | undefined;
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        message: e?.message ?? String(err),
        stack: e?.stack,
      }),
    );
  } catch {
    /* noop */
  }
};

const redirectToError = (reason: string) => {
  if (window.location.pathname === "/error") return;
  window.location.replace(`/error?reason=${encodeURIComponent(reason)}`);
};

window.addEventListener("error", (event) => {
  recordError(event.error ?? event.message);
});
window.addEventListener("unhandledrejection", (event) => {
  recordError(event.reason);
});

try {
  const container = document.getElementById("root");
  if (!container) throw new Error("Root container #root not found");
  applyConfigToRuntime();
  runMigrations();
  runSeed();
  createRoot(container).render(<App />);
} catch (err) {
  recordError(err);
  redirectToError("boot");
}
