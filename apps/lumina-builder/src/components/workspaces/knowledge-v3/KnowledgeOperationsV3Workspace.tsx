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
  BookOpenCheck,
  BrainCircuit,
  Clock3,
  FileSearch,
  Gauge,
  Layers3,
  ListTree,
} from "lucide-react";

import {
  LuminaSectionNavigator,
} from "@/components/lumina/workspace/primitives/LuminaSectionNavigator";

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
  KnowledgeV3WorkspaceProvider,
  useKnowledgeV3Workspace,
} from "./state";

const LEARNING_SECTIONS = [
  {
    id: "learning-genesis-corpus",
    label: "Genesis Corpus",
    icon: BookOpenCheck,
  },
  {
    id: "learning-genesis-sources",
    label: "Genesis Sources",
    icon: Layers3,
  },
  {
    id: "learning-corpus-explorer",
    label: "Corpus Explorer",
    icon: ListTree,
  },
  {
    id: "learning-artifact-inspector",
    label: "Artifact Inspector",
    icon: FileSearch,
  },
  {
    id: "learning-timeline",
    label: "Timeline",
    icon: Clock3,
  },
  {
    id: "learning-competency",
    label: "Competency",
    icon: BrainCircuit,
  },
  {
    id: "learning-activation",
    label: "Activation",
    icon: Gauge,
  },
] as const;

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
      domainNavigator={null}
      workspaceHeader={
        <KnowledgeWorkspaceHeader />
      }
      productionNavigator={null}
      learningNavigator={
        learning ? (
          <LuminaSectionNavigator
            items={LEARNING_SECTIONS}
            ariaLabel="Educational learning sections"
            topTargetId="learning-command-center-top"
            minWidthClassName="min-w-[920px]"
            gridColumnsClassName="grid-cols-7"
          />
        ) : null
      }
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
