import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RequireAuth } from "@/components/RequireAuth";
import Index from "./pages/index";
import NotFound from "./pages/NotFound.tsx";
import ErrorPage from "./pages/ErrorPage.tsx";
import TemplatePage from "./pages/TemplatePage.tsx";
import PreviewPage from "./pages/PreviewPage.tsx";
import InviteAcceptPage from "./pages/InviteAcceptPage.tsx";

const App = () => (
  <ErrorBoundary>
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/templates/:slug" element={<TemplatePage />} />
        <Route path="/preview/:projectSlug" element={<RequireAuth><PreviewPage /></RequireAuth>} />
        <Route path="/invite/:token" element={<InviteAcceptPage />} />
        <Route path="/error" element={<ErrorPage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
