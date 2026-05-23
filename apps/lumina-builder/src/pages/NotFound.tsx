import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-aurora)" }}
      />
      <div className="relative z-10 text-center">
        <p className="text-[8rem] font-bold leading-none text-gradient-lumina sm:text-[10rem]">
          404
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
          This page drifted off the grid
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          The route <code className="rounded bg-muted px-1.5 py-0.5 text-foreground/80">{location.pathname}</code> doesn't exist. Let's get you back.
        </p>
        <Link
          to="/"
          className="ring-glow mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary/70"
        >
          <ArrowLeft className="h-4 w-4" />
          Return home
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
