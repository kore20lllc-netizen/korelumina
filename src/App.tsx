import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RequireAuth } from "@/components/RequireAuth";

const Index = lazy(() => import("./pages/index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ErrorPage = lazy(() => import("./pages/ErrorPage"));
const TemplatePage = lazy(() => import("./pages/TemplatePage"));
const PreviewPage = lazy(() => import("./pages/PreviewPage"));
const InviteAcceptPage = lazy(() => import("./pages/InviteAcceptPage"));

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      Loading...
    </div>
  );
}

const App = () => (
  <ErrorBoundary>
    <Sonner />
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/templates/:slug" element={<TemplatePage />} />
          <Route
            path="/preview/:projectSlug"
            element={
              <RequireAuth>
                <PreviewPage />
              </RequireAuth>
            }
          />
          <Route path="/invite/:token" element={<InviteAcceptPage />} />
          <Route path="/error" element={<ErrorPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
