import { ActivityRail } from "./layout/ActivityRail";
import { ExecutiveRibbon } from "./layout/ExecutiveRibbon";
import { InspectorDock } from "./layout/InspectorDock";
import { ProductionNavigator } from "./layout/ProductionNavigator";
import { SpatialCanvas } from "./layout/SpatialCanvas";
import { WorkspaceShell } from "./layout/WorkspaceShell";

export function KnowledgeOperationsV3Workspace() {
  return (
    <WorkspaceShell
      executiveRibbon={<ExecutiveRibbon />}
      productionNavigator={<ProductionNavigator />}
      activityRail={<ActivityRail />}
      spatialCanvas={<SpatialCanvas />}
      inspectorDock={<InspectorDock />}
    />
  );
}

export default KnowledgeOperationsV3Workspace;
