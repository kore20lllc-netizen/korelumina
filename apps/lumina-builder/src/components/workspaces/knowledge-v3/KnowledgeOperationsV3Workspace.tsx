import { ExecutiveRibbonProvider } from "./layout/ExecutiveRibbonProvider";
import { ActivityRail } from "./layout/ActivityRail";
import { ExecutiveRibbon } from "./layout/ExecutiveRibbon";
import { InspectorDock } from "./layout/InspectorDock";
import { KnowledgeWorkspaceHeader } from "./layout/KnowledgeWorkspaceHeader";
import { ProductionNavigator } from "./layout/ProductionNavigator";
import { SpatialCanvas } from "./layout/SpatialCanvas";
import { WorkspaceShell } from "./layout/WorkspaceShell";

export function KnowledgeOperationsV3Workspace() {
  return (
    <ExecutiveRibbonProvider>
      <WorkspaceShell
        executiveRibbon={<ExecutiveRibbon />}
        workspaceHeader={<KnowledgeWorkspaceHeader />}
        productionNavigator={<ProductionNavigator />}
        activityRail={<ActivityRail />}
        spatialCanvas={<SpatialCanvas />}
        inspectorDock={<InspectorDock />}
      />
    </ExecutiveRibbonProvider>
  );
}

export default KnowledgeOperationsV3Workspace;
