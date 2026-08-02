import {
  EducationalCommandCenter,
  EducationalProgress,
} from "../knowledge/learning";

import {
  useEducationalDashboardState,
} from "../knowledge/learning/state";

import {
  EducationalCommandDeck,
} from "./hero";

import {
  ActivityRail,
} from "./layout/ActivityRail";

import {
  ExecutiveRibbon,
} from "./layout/ExecutiveRibbon";

import {
  InspectorDock,
} from "./layout/InspectorDock";

import {
  KnowledgeWorkspaceHeader,
} from "./layout/KnowledgeWorkspaceHeader";

import {
  ProductionNavigator,
} from "./layout/ProductionNavigator";

import {
  SpatialCanvas,
} from "./layout/SpatialCanvas";

import {
  WorkspaceShell,
} from "./layout/WorkspaceShell";

import {
  KnowledgeDomainNavigator,
} from "./navigation";

import {
  KnowledgeV3WorkspaceProvider,
  useKnowledgeV3Workspace,
} from "./state";

function KnowledgeOperationsV3Content() {
  const educationalDashboardState =
    useEducationalDashboardState();

  const {
    activeDomain,
  } = useKnowledgeV3Workspace();

  const learning =
    activeDomain === "learning";

  return (
    <WorkspaceShell
      executiveRibbon={
        <ExecutiveRibbon />
      }
      educationalCommandDeck={
        learning
          ? (
                    <EducationalProgress
                      modules={educationalDashboardState.modules}
                      selectedModuleId={
                        educationalDashboardState.selection.moduleId
                      }
                      onModuleSelect={
                        educationalDashboardState.selection.setModuleId
                      }
                    />
            )
          : null
      }
      domainNavigator={
        <KnowledgeDomainNavigator />
      }
      workspaceHeader={
        <KnowledgeWorkspaceHeader />
      }
      productionNavigator={
        learning
          ? null
          : <ProductionNavigator />
      }
      activityRail={
        learning
          ? null
          : <ActivityRail />
      }
      spatialCanvas={
        learning ? (
          <EducationalCommandCenter />
        ) : (
          <SpatialCanvas />
        )
      }
      inspectorDock={
        learning
          ? null
          : <InspectorDock />
      }
      compactContent={learning}
    />
  );
}

export function KnowledgeOperationsV3Workspace() {
  return (
    <KnowledgeV3WorkspaceProvider>
      <KnowledgeOperationsV3Content />
    </KnowledgeV3WorkspaceProvider>
  );
}

export default KnowledgeOperationsV3Workspace;
