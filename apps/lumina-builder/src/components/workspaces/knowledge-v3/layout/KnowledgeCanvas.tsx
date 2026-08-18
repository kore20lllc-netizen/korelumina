import { CanvasBottomRegion } from "./canvas/CanvasBottomRegion";
import { CanvasSurface } from "./canvas/CanvasSurface";
import { KnowledgeOrchestrationCanvas } from "./canvas/orchestration/KnowledgeOrchestrationCanvas";
import { GraphViewport } from "./canvas/GraphViewport";
import { TimelineViewport } from "./canvas/TimelineViewport";

export function KnowledgeCanvas() {
  return (
    <CanvasSurface>
      <KnowledgeOrchestrationCanvas />

      <CanvasBottomRegion>
        <GraphViewport />

        <TimelineViewport />
      </CanvasBottomRegion>
    </CanvasSurface>
  );
}
