import { Shell } from "@/components/layout/Shell";
import { WorkspaceProvider, useWorkspace } from "@/context/WorkspaceContext";
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
import { ImportModal } from "@/components/import/ImportModal";
import { DeployModal } from "@/components/deploy/DeployModal";
import { LandingPage } from "@/pages/LandingPage";

function Router() {
  const { view, mode } = useWorkspace();
  if (view === "landing") return <LandingPage />;
  if (view === "entry") return <Shell blobs="hero"><EntryView /></Shell>;
  if (view === "dashboard") return <Shell blobs="ambient"><DashboardView /></Shell>;
  if (view === "auth") return <Shell blobs="hero"><AuthView /></Shell>;
  if (view === "settings") return <Shell blobs="ambient"><SettingsView /></Shell>;
  if (view === "pricing") return <Shell blobs="ambient"><PricingView /></Shell>;
  if (view === "templates") return <Shell blobs="ambient"><TemplatesMarketplace /></Shell>;
  if (view === "imports") return <Shell blobs="ambient"><ImportsView /></Shell>;
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
      <WorkspaceProvider>
        <Router />
        <ImportModal />
        <DeployModal />
      </WorkspaceProvider>
    </GlassTintProvider>
  );
}
