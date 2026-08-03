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
  KnowledgeProductionCommandCenter,
} from "../knowledge/production";

import {
  ExecutiveRibbon,
} from "./layout/ExecutiveRibbon";

import {
  KnowledgeWorkspaceHeader,
} from "./layout/KnowledgeWorkspaceHeader";

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
      productionNavigator={null}
      activityRail={null}
      spatialCanvas={
        learning ? (
          <EducationalCommandCenter />
        ) : (
          <KnowledgeProductionCommandCenter />
        )
      }
      inspectorDock={null}
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
