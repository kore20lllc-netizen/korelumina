import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, ChevronDown } from "lucide-react";
import { LuminaButton } from "../src/components/lumina/LuminaButton";

interface State {
  error: Error | null;
  errorInfo: string | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, errorInfo: null, showDetails: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error("App crashed:", error, info);
    this.setState({ errorInfo: info.componentStack ?? null });
    try {
      sessionStorage.setItem(
        "lumina:lastError",
        JSON.stringify({
          message: error.message,
          stack: `${error.stack ?? ""}${info.componentStack ?? ""}`,
        }),
      );
    } catch {
      /* noop */
    }
    if (window.location.pathname !== "/error") {
      window.location.replace("/error?reason=runtime");
    }
  }

  retry = () => {
    this.setState({ error: null, errorInfo: null, showDetails: false });
  };

  goHome = () => {
    this.setState({ error: null, errorInfo: null, showDetails: false });
    window.location.href = "/";
  };

  hardReload = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState((s) => ({ showDetails: !s.showDetails }));
  };

  render() {
    const { error, errorInfo, showDetails } = this.state;
    if (!error) return this.props.children;

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
            Something broke unexpectedly
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Don't worry — your work is safe. You can retry the last action, head back to
            your workspace, or reload the app entirely.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
            <LuminaButton onClick={this.retry} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4" />
              Try again
            </LuminaButton>
            <LuminaButton
              variant="ghost"
              onClick={this.goHome}
              className="w-full sm:w-auto"
            >
              <Home className="h-4 w-4" />
              Back to workspace
            </LuminaButton>
            <LuminaButton
              variant="subtle"
              onClick={this.hardReload}
              className="w-full sm:w-auto"
            >
              Reload app
            </LuminaButton>
          </div>

          <div className="mt-6 text-left">
            <button
              type="button"
              onClick={this.toggleDetails}
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
                  {error.message}
                  {errorInfo ? `\n${errorInfo}` : ""}
                </code>
              </pre>
            )}
          </div>
        </div>
      </main>
    );
  }
}
