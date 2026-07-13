import type {
  KnowledgeOperationsSnapshot,
} from "@korelumina/platform-sdk";

interface Props {
  snapshot: KnowledgeOperationsSnapshot | null;
}

export function KnowledgeGraphPanel({
  snapshot,
}: Props) {
  if (!snapshot) {
    return (
      <div className="flex h-full items-center justify-center p-10 text-sm text-muted-foreground">
        Loading knowledge…
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[700px] overflow-hidden rounded-[32px]">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,.18),transparent_55%)]" />

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative z-10 flex h-full flex-col justify-between p-8">

        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-violet-300">
            Knowledge Graph
          </div>

          <div className="mt-2 text-4xl font-semibold">
            {snapshot.summary.totalKnowledgeItems}
          </div>

          <div className="text-sm text-muted-foreground">
            Canonical knowledge nodes
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
          Interactive graph visualization will be connected to the
          runtime knowledge graph service.
        </div>

      </div>

    </div>
  );
}
