import { lazy, Suspense, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
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
import { AuthView } from "@/components/workspaces/AuthView";
import { SettingsView } from "@/components/workspaces/SettingsView";
import { PricingView } from "@/components/workspaces/PricingView";
import { InHouseDevDashboard } from "@/components/workspaces/InHouseDevDashboard";
import { ImpersonationBanner } from "@/components/workspaces/admin/ImpersonationBanner";
import { ImportModal } from "@/components/import/ImportModal";
import { DeployModal } from "@/components/deploy/DeployModal";
import { LandingPage } from "@/pages/LandingPage";
import { TransformProvider } from "@/context/TransformContext";
import { TransformModal } from "@/components/transform/TransformModal";
import { TransformAnalyticsMount } from "@/components/transform/TransformAnalyticsMount";
import {
  WorkspaceAppearanceAdapter,
  WorkspaceAppearanceProvider,
} from "@/components/workspace-appearance";

const RepoAuditWorkspace = lazy(() =>
  import("@/components/workspaces/RepoAuditWorkspace").then((m) => ({
    default: m.RepoAuditWorkspace,
  })),
);

const AdminWorkspace = lazy(() =>
  import("@/components/workspaces/AdminWorkspace").then((m) => ({
    default: m.AdminWorkspace,
  })),
);

const KnowledgeOperationsV3Workspace = lazy(() =>
  import(
    "@/components/workspaces/knowledge-v3"
  ),
);

const DesignerWorkspace = lazy(() =>
  import("@/components/workspaces/DesignerWorkspace").then((m) => ({
    default: m.DesignerWorkspace,
  })),
);

const DeveloperWorkspace = lazy(() =>
  import("@/components/workspaces/DeveloperWorkspace").then((m) => ({
    default: m.DeveloperWorkspace,
  })),
);

const ImportsView = lazy(() =>
  import("@/components/workspaces/ImportsView").then((m) => ({
    default: m.ImportsView,
  })),
);

const TemplatesMarketplace = lazy(() =>
  import("@/components/templates/TemplatesMarketplace").then((m) => ({
    default: m.TemplatesMarketplace,
  })),
);


const RuntimeDiagnosticsWorkspace = lazy(() =>
  import("@/components/workspaces/RuntimeDiagnosticsWorkspace").then((m) => ({
    default: m.RuntimeDiagnosticsWorkspace,
  })),
);

const RuntimeOperationsWorkspace = lazy(() =>
  import(
    "@/components/workspaces/runtime/RuntimeOperationsWorkspace"
  ).then((m) => ({
    default: m.RuntimeOperationsWorkspace,
  })),
);


const LoadingView = () => (
  <div className="p-6 text-sm text-muted-foreground">Loading...</div>
);

const INTENDED_VIEW_KEY = "korelumina:intendedView";

const readIntended = (): View | null => {
  if (typeof window === "undefined") return null;

  try {
    return (window.sessionStorage.getItem(INTENDED_VIEW_KEY) as View) || null;
  } catch {
    return null;
  }
};

const writeIntended = (view: View | null) => {
  if (typeof window === "undefined") return;

  try {
    if (view) {
      window.sessionStorage.setItem(INTENDED_VIEW_KEY, view);
    } else {
      window.sessionStorage.removeItem(INTENDED_VIEW_KEY);
    }
  } catch {
    // noop
  }
};

function Router() {
  const { view, mode, setView } = useWorkspace();
  const authed = useIsAuthenticated();
  const navigate = useNavigate();

  const publicViews: View[] = ["landing", "auth", "pricing", "templates"];
  const isPublic = publicViews.includes(view);
  const isAdmin = getCapabilities(getCurrentRole()).adminTools;

  useEffect(() => {
    if (!authed && !isPublic) {
      writeIntended(view);
      setView("auth");
    }
  }, [authed, isPublic, view, setView]);

  const prevAuthedRef = useRef(authed);

  useEffect(() => {
    if (prevAuthedRef.current && !authed) {
      writeIntended(null);
    }

    prevAuthedRef.current = authed;
  }, [authed]);

  useEffect(() => {
    if ((view === "repo-audit" || view === "inhouse-dev") && !isAdmin) {
      setView("dashboard");
    }
  }, [view, isAdmin, setView]);

  useEffect(() => {
    if (!authed || view !== "auth") return;

    const path = consumeIntendedPath();

    if (path && path !== "/") {
      writeIntended(null);
      navigate(path);
      return;
    }

    const next = readIntended();

    if (next) {
      writeIntended(null);
      setView(next);
      return;
    }

    setView("dashboard");
  }, [authed, view, setView, navigate]);

  if (!authed && !isPublic) {
    return (
      <Shell blobs="hero">
        <AuthView />
      </Shell>
    );
  }

  if ((view === "repo-audit" || view === "inhouse-dev") && !isAdmin) {
    return null;
  }

  if (view === "landing") return <LandingPage />;

  if (view === "entry") {
    return (
      <Shell blobs="hero">
        <EntryView />
      </Shell>
    );
  }

  if (view === "dashboard") {
    return (
      <Shell blobs="ambient">
        <DashboardView />
      </Shell>
    );
  }

  if (view === "auth") {
    return (
      <Shell blobs="hero">
        <AuthView />
      </Shell>
    );
  }

  if (view === "settings") {
    return (
      <Shell blobs="ambient">
        <SettingsView />
      </Shell>
    );
  }

  if (view === "pricing") {
    return (
      <Shell blobs="ambient">
        <PricingView />
      </Shell>
    );
  }

  if (view === "templates") {
    return (
      <Shell blobs="ambient">
        <Suspense fallback={<LoadingView />}>
          <TemplatesMarketplace />
        </Suspense>
      </Shell>
    );
  }

  if (view === "imports") {
    return (
      <Shell blobs="ambient">
        <Suspense fallback={<LoadingView />}>
          <ImportsView />
        </Suspense>
      </Shell>
    );
  }

  if (view === "repo-audit") {
    return (
      <Shell blobs="ambient">
        <Suspense fallback={<LoadingView />}>
          <RepoAuditWorkspace />
        </Suspense>
      </Shell>
    );
  }

  if (view === "inhouse-dev") {
    return (
      <Shell blobs="ambient">
        <InHouseDevDashboard />
      </Shell>
    );
  }

  
  if (view === "knowledge-operations") {
    return (
      <Shell blobs="ambient">
        <Suspense fallback={<LoadingView />}>
          <KnowledgeOperationsV3Workspace
            setView={setView}
          />
        </Suspense>
      </Shell>
    );
  }

if (view === "deployment-diagnostics") {
    return (
      <Shell blobs="ambient">
        <Suspense fallback={<LoadingView />}>
          <RuntimeDiagnosticsWorkspace />
        </Suspense>
      </Shell>
    );
  }



    if (view === "runtime-operations") {
    return (
      <Shell blobs="ambient">
        <Suspense fallback={<LoadingView />}>
          <RuntimeOperationsWorkspace />
        </Suspense>
      </Shell>
    );
  }

  if (view === "admin") {
    return (
      <Shell blobs="ambient">
        <Suspense fallback={<LoadingView />}>
          <AdminWorkspace />
        </Suspense>
      </Shell>
    );
  }

  if (!authed) {
    return (
      <Shell blobs="hero">
        <AuthView />
      </Shell>
    );
  }

  return (
    <Shell blobs="soft">
      <Suspense fallback={<LoadingView />}>
        {mode === "ai" && <AIWorkspace />}
        {mode === "designer" && <DesignerWorkspace />}
        {mode === "developer" && <DeveloperWorkspace />}
      </Suspense>
    </Shell>
  );
}

export default function Index() {
  return (
    <AuthProvider>
      <GlassTintProvider>
        <ActiveTeamProvider>
          <WorkspaceProvider>
            <WorkspaceAppearanceProvider>
              <WorkspaceAppearanceAdapter />

              <TransformProvider>
                <ImpersonationBanner />
                <Router />
                <ImportModal />
                <DeployModal />
                <TransformModal />
                <TransformAnalyticsMount />
              </TransformProvider>
            </WorkspaceAppearanceProvider>
          </WorkspaceProvider>
        </ActiveTeamProvider>
      </GlassTintProvider>
    </AuthProvider>
  );
}
