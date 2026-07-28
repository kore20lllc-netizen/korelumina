import {
  KNOWLEDGE_PACKAGES,
  KNOWLEDGE_STAGES,
} from "../data/knowledgePackages";
import {
  getStageTelemetry,
} from "../analytics/getStageTelemetry";
import {
  computePipelineLayout,
} from "../layout/computePipelineLayout";
import {
  computePipelineRoute,
} from "../routing/computePipelineRoute";
import {
  buildRouteSegments,
} from "../rendering/buildRouteSegments";
import {
  buildKnowledgeLineage,
} from "../lineage/buildKnowledgeLineage";
import {
  projectPipelineState,
} from "../projection/projectPipelineState";

export function buildPipelinePresentation() {

  const projection =
    projectPipelineState([]);
  const routedPackages =
    computePipelineRoute(
      computePipelineLayout(
        KNOWLEDGE_PACKAGES,
      ),
    );


  const lineage =
    buildKnowledgeLineage(
      projection.packages,
    );

  return {
    stages: KNOWLEDGE_STAGES.map(
      (stage) => ({
        name: stage,
        telemetry:
          getStageTelemetry(stage),
      }),
    ),

    packages: routedPackages,

    routes:
      buildRouteSegments(
        routedPackages,
      ),

    lineage,
  };
}
