import { Shell } from "@/components/layout/Shell";
import { WorkspaceProvider, useWorkspace } from "@/context/WorkspaceContext";
import { GlassTintProvider } from "@/context/GlassTintContext";
import { EntryView } from "@/components/workspaces/EntryView";
import { DashboardView } from "@/components/workspaces/DashboardView";
import { AIWorkspace } from "@/components/workspaces/AIWorkspace";
import { DesignerWorkspace } from "@/components/workspaces/DesignerWorkspace";
import { DeveloperWorkspace } from "@/components/workspaces/DeveloperWorkspace";

function Router() {
  const { view, mode } = useWorkspace();
  if (view === "entry") return <Shell blobs="hero"><EntryView /></Shell>;
  if (view === "dashboard") return <Shell blobs="ambient"><DashboardView /></Shell>;
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
      </WorkspaceProvider>
    </GlassTintProvider>
  );
}
