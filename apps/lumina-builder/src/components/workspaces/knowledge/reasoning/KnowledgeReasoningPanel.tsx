import type {
  KnowledgeOperationsSnapshot,
} from "@korelumina/platform-sdk";

interface Props {
  snapshot: KnowledgeOperationsSnapshot | null;
}

export function KnowledgeReasoningPanel({
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
    <div className="p-6">
      <h2 className="text-lg font-semibold">
        Knowledge Reasoning
      </h2>

      <p className="mt-2 text-sm text-muted-foreground">
        Executive reasoning and recommendation engine.
      </p>

      <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
        <div>
          Canonical Knowledge:{" "}
          {snapshot.summary.totalKnowledgeItems}
        </div>

        <div className="mt-2">
          Evidence:{" "}
          {snapshot.summary.totalEvidence}
        </div>

        <div className="mt-2">
          Health:{" "}
          {snapshot.summary.healthScore ===
          null
            ? "Not measured"
            : `${snapshot.summary.healthScore}%`}
        </div>
      </div>
    </div>
  );
}
