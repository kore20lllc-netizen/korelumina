import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { consumeIntendedPath } from "@/components/RequireAuth";
import { getCapabilities, getCurrentRole } from "@/services/workspaceAccessService";
import { Shell } from "@/components/layout/Shell";
import { WorkspaceProvider, useWorkspace, type View } from "@/context/WorkspaceContext";
import { ActiveTeamProvider } from "@/context/ActiveTeamContext";
import { useIsAuthenticated } from "@/hooks/use-auth";
import { GlassTintProvider } from "@/context/GlassTintContext";
import { EntryView } from "@/components/workspaces/EntryView";
import { DashboardView } from "@/components/workspaces/DashboardView";
import { AIWorkspace } from "@/components/workspaces/AIWorkspace";
import { DesignerWorkspace } from "@/components/workspaces/DesignerWorkspace";
import { DeveloperWorkspace } from "@/components/workspaces/DeveloperWorkspace";
import { AuthView } from "@/components/workspaces/AuthView";
import { SettingsView } from "@/components/workspaces/SettingsView";
import { PricingView } from "@/components/workspaces/PricingView";
import { TemplatesMarketplace } from "@/components/templates/TemplatesMarketplace";
import { ImportsView } from "@/components/workspaces/ImportsView";
import { RepoAuditWorkspace } from "@/components/workspaces/RepoAuditWorkspace";
import { InHouseDevDashboard } from "@/components/workspaces/InHouseDevDashboard";
import { AdminWorkspace } from "@/components/workspaces/AdminWorkspace";
import { ImpersonationBanner } from "@/components/workspaces/admin/ImpersonationBanner";
import { ImportModal } from "@/components/import/ImportModal";
import { DeployModal } from "@/components/deploy/DeployModal";
import { LandingPage } from "@/pages/LandingPage";
import { TransformProvider } from "@/context/TransformContext";
import { TransformModal } from "@/components/transform/TransformModal";
import { TransformAnalyticsMount } from "@/components/transform/TransformAnalyticsMount";

const INTENDED_VIEW_KEY = "korelumina:intendedView";
const readIntended = (): View | null => {
  if (typeof window === "undefined") return null;
  try { return (window.sessionStorage.getItem(INTENDED_VIEW_KEY) as View) || null; } catch { return null; }
};
const writeIntended = (v: View | null) => {
  if (typeof window === "undefined") return;
  try {
    if (v) window.sessionStorage.setItem(INTENDED_VIEW_KEY, v);
    else window.sessionStorage.removeItem(INTENDED_VIEW_KEY);
  } catch {}
};

function Router() {
  const { view, mode, setView } = useWorkspace();
  const authed = useIsAuthenticated();
  const navigate = useNavigate();
  const PUBLIC_VIEWS: View[] = ["landing", "auth", "pricing", "templates"];
  const isPublic = PUBLIC_VIEWS.includes(view);
  const isAdmin = getCapabilities(getCurrentRole()).adminTools;

  // If user hits a protected view while signed-out, remember it and bounce to auth.
  useEffect(() => {
    if (!authed && !isPublic) {
      writeIntended(view);
      setView("auth");
    }
  }, [authed, isPublic, view, setView]);

  // On explicit sign-out (authed: true -> false), drop the stored intended view.
  const prevAuthedRef = useRef(authed);
  useEffect(() => {
    if (prevAuthedRef.current && !authed) writeIntended(null);
    prevAuthedRef.current = authed;
  }, [authed]);

  // Admin-only views: redirect non-admins to dashboard.
  useEffect(() => {
    if ((view === "repo-audit" || view === "inhouse-dev") && !isAdmin) {
      setView("dashboard");
    }
  }, [view, isAdmin, setView]);

  // After successful sign-in, resume the originally requested view.
  useEffect(() => {
    if (authed && view === "auth") {
      // Deep-link path (e.g. /preview/:slug) wins over view restore.
      const path = consumeIntendedPath();
      if (path && path !== "/") { writeIntended(null); navigate(path); return; }
      const next = readIntended();
      if (next) {
        writeIntended(null);
        setView(next);
      }
    }
  }, [authed, view, setView, navigate]);

  if (!authed && !isPublic) return <Shell blobs="hero"><AuthView /></Shell>;
  if ((view === "repo-audit" || view === "inhouse-dev") && !isAdmin) return null;

  if (view === "landing") return <LandingPage />;
  if (view === "entry") return <Shell blobs="hero"><EntryView /></Shell>;
  if (view === "dashboard") return <Shell blobs="ambient"><DashboardView /></Shell>;
  if (view === "auth") return <Shell blobs="hero"><AuthView /></Shell>;
  if (view === "settings") return <Shell blobs="ambient"><SettingsView /></Shell>;
  if (view === "pricing") return <Shell blobs="ambient"><PricingView /></Shell>;
  if (view === "templates") return <Shell blobs="ambient"><TemplatesMarketplace /></Shell>;
  if (view === "imports") return <Shell blobs="ambient"><ImportsView /></Shell>;
  if (view === "repo-audit") return <Shell blobs="ambient"><RepoAuditWorkspace /></Shell>;
  if (view === "inhouse-dev") return <Shell blobs="ambient"><InHouseDevDashboard /></Shell>;
  if (view === "admin") return <Shell blobs="ambient"><AdminWorkspace /></Shell>;
  return (
    <Shell blobs="soft">
      {mode === "ai" && <AIWorkspace />}
      {mode === "designer" && <DesignerWorkspace />}
      {mode === "developer" && <DeveloperWorkspace />}
    </Shell>
  );
}

export default function Index() {
  return (
    <GlassTintProvider>
      <ActiveTeamProvider>
        <WorkspaceProvider>
        <TransformProvider>
          <ImpersonationBanner />
          <Router />
          <ImportModal />
          <DeployModal />
          <TransformModal />
          <TransformAnalyticsMount />
        </TransformProvider>
        </WorkspaceProvider>
      </ActiveTeamProvider>
    </GlassTintProvider>
  );
}
