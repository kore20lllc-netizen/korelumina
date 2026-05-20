import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RequireAuth } from "@/components/RequireAuth";
import { WorkspaceProvider } from "@/context/WorkspaceContext";

const Index = lazy(() => import("./pages/Index"));
const TemplatePage = lazy(() => import("./pages/TemplatePage"));
const PreviewPage = lazy(() => import("./pages/PreviewPage"));
const InviteAcceptPage = lazy(() => import("./pages/InviteAcceptPage"));
const ErrorPage = lazy(() => import("./pages/ErrorPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <ErrorBoundary>
    <WorkspaceProvider>
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={null}>
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
    </WorkspaceProvider>
  </ErrorBoundary>
);

export default App;
