import { KnowledgeFlowLane } from "./components/KnowledgeFlowLane";
import { KnowledgeSelectionProvider } from "./state/KnowledgeSelectionContext";

export function KnowledgeOrchestrationCanvas() {
  return (
    <section
      className="
        relative
        flex
        min-h-[560px]
        items-stretch
        
        rounded-3xl
        border
        border-dashed
        border-cyan-500/30
        bg-gradient-to-br
        from-slate-950/40
        to-slate-900/30
      "
    >
      <KnowledgeSelectionProvider>
  <div
    className="
      relative
      w-full
      px-10
      py-8
    "
  >
    <KnowledgeFlowLane />
  </div>
</KnowledgeSelectionProvider>
    </section>
  );
}
