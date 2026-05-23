import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Home, ChevronDown } from "lucide-react";
import { LuminaButton } from "@/components/lumina/LuminaButton";

const STORAGE_KEY = "lumina:lastError";

const ErrorPage = () => {
  const [params] = useSearchParams();
  const [showDetails, setShowDetails] = useState(false);
  const [stored, setStored] = useState<{ message?: string; stack?: string } | null>(null);

  const reason = params.get("reason") ?? undefined;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setStored(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);

  const message =
    stored?.message ??
    (reason === "boot"
      ? "The app failed to start. This is usually temporary."
      : "Something broke unexpectedly.");

  const retry = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    window.location.href = "/";
  };

  const hardReload = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    window.location.reload();
  };

  return (
    <main
      role="alert"
      aria-live="assertive"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-aurora)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, hsl(var(--background) / 0.4), hsl(var(--background) / 0.85) 80%)",
        }}
      />

      <div className="glass-panel relative z-10 w-full max-w-lg p-8 text-center sm:p-10">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--magenta) / 0.25), hsl(var(--violet) / 0.25) 50%, hsl(var(--cyan) / 0.2))",
            boxShadow: "var(--glow-violet)",
          }}
        >
          <AlertTriangle className="h-6 w-6 text-foreground" aria-hidden />
        </div>

        <p className="mt-5 text-5xl font-bold leading-none text-gradient-lumina sm:text-6xl">
          Oops
        </p>
        <h1 className="mt-3 text-xl font-semibold text-foreground sm:text-2xl">
          We hit a snag
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          {message} Your work is safe — try again or head back to your workspace.
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
          <LuminaButton onClick={retry} className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4" />
            Try again
          </LuminaButton>
          <Link to="/" className="w-full sm:w-auto">
            <LuminaButton variant="ghost" className="w-full">
              <Home className="h-4 w-4" />
              Back to workspace
            </LuminaButton>
          </Link>
          <LuminaButton variant="subtle" onClick={hardReload} className="w-full sm:w-auto">
            Reload app
          </LuminaButton>
        </div>

        {(stored?.stack || reason) && (
          <div className="mt-6 text-left">
            <button
              type="button"
              onClick={() => setShowDetails((s) => !s)}
              className="ring-glow inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition hover:text-foreground"
              aria-expanded={showDetails}
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  showDetails ? "rotate-180" : ""
                }`}
                aria-hidden
              />
              {showDetails ? "Hide" : "Show"} technical details
            </button>
            {showDetails && (
              <pre className="mt-3 max-h-48 overflow-auto rounded-lg border border-border bg-muted/50 p-3 text-left text-[11px] leading-relaxed text-muted-foreground">
                <code>
                  {reason ? `reason: ${reason}\n` : ""}
                  {stored?.message ?? ""}
                  {stored?.stack ? `\n${stored.stack}` : ""}
                </code>
              </pre>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default ErrorPage;
