import { lazy, Suspense } from "react";
import { WorkspaceProvider } from "@/context/WorkspaceContext";

/*
  Current task:
  Optimize the landing page with lazy loading.

  Status:
  - Build is green.
  - Landing page loads correctly.
  - Template route is stable.
  - No black screen.

  LandingPage.tsx exports a named export: LandingPage.
*/
const LandingPage = lazy(async () => {
  const mod = await import("./LandingPage");
  return {
    default: mod.LandingPage,
  };
});

function LandingFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-sm text-white/70">
        Loading KoreLumina...
      </div>
    </div>
  );
}

export default function Index() {
  return (
    <WorkspaceProvider>
      <Suspense fallback={<LandingFallback />}>
        <LandingPage />
      </Suspense>
    </WorkspaceProvider>
  );
}
