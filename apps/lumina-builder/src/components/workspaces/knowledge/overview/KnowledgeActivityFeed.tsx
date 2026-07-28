import {
  ArrowRight,
  GitBranch,
  Network,
  Sparkles,
} from "lucide-react";

const NODES = [
  {
    title: "Architecture Decision",
    type: "Canonical",
    x: "8%",
    y: "18%",
  },
  {
    title: "Workflow Rule",
    type: "Canonical",
    x: "40%",
    y: "34%",
  },
  {
    title: "UI Contract",
    type: "Canonical",
    x: "76%",
    y: "20%",
  },
  {
    title: "Pattern",
    type: "Knowledge",
    x: "58%",
    y: "72%",
  },
  {
    title: "Business Rule",
    type: "Knowledge",
    x: "18%",
    y: "78%",
  },
];

export function KnowledgeActivityFeed() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Knowledge Graph
          </div>

          <h3 className="mt-2 text-lg font-semibold">
            Canonical Relationship Projection
          </h3>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs">
          <Network className="h-4 w-4" />
          Projection
        </div>
      </div>

      <div className="relative mt-6 h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-black/20">

        <svg
          className="absolute inset-0 h-full w-full opacity-30"
          preserveAspectRatio="none"
        >
          <line
            x1="18%"
            y1="78%"
            x2="40%"
            y2="34%"
            stroke="white"
          />

          <line
            x1="40%"
            y1="34%"
            x2="76%"
            y2="20%"
            stroke="white"
          />

          <line
            x1="40%"
            y1="34%"
            x2="58%"
            y2="72%"
            stroke="white"
          />

          <line
            x1="8%"
            y1="18%"
            x2="40%"
            y2="34%"
            stroke="white"
          />
        </svg>

        {NODES.map((node) => (
          <div
            key={node.title}
            className="absolute w-44 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-white/[0.05] p-3 backdrop-blur"
            style={{
              left: node.x,
              top: node.y,
            }}
          >
            <div className="flex items-center justify-between">
              <GitBranch className="h-4 w-4 text-violet-300" />
              <ArrowRight className="h-3 w-3 opacity-40" />
            </div>

            <div className="mt-3 text-sm font-semibold">
              {node.title}
            </div>

            <div className="mt-1 text-xs text-muted-foreground">
              {node.type}
            </div>
          </div>
        ))}

        <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs">
          <Sparkles className="h-4 w-4 text-amber-300" />
          Graph Projection
        </div>
      </div>
    </div>
  );
}
