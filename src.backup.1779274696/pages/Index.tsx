import { LandingPage } from "@/pages/LandingPage";
import { useWorkspace } from "@/context/WorkspaceContext";

import { AuthView } from "@/components/workspaces/AuthView";
import { EntryView } from "@/components/workspaces/EntryView";
import { DashboardView } from "@/components/workspaces/DashboardView";
import { PricingView } from "@/components/workspaces/PricingView";
import { SettingsView } from "@/components/workspaces/SettingsView";
import { TemplatesMarketplace } from "@/components/templates/TemplatesMarketplace";

export default function Index() {
  const { view } = useWorkspace();

  switch (view) {
    case "auth":
      return <AuthView />;

    case "entry":
      return <EntryView />;

    case "dashboard":
      return <DashboardView />;

    case "workspace":
      // In the root KoreLumina shell, workspace routes through dashboard.
      return <DashboardView />;

    case "pricing":
      return <PricingView />;

    case "templates":
      return <TemplatesMarketplace />;

    case "settings":
      return <SettingsView />;

    case "repo-audit":
      // RepoAuditView does not exist in the root project.
      // Route to dashboard to avoid module load failure.
      return <DashboardView />;

    case "landing":
    default:
      return <LandingPage />;
  }
}
