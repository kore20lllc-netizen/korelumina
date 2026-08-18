import {
  GitBranch,
  Network,
  Route,
  Target,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  LuminaFlagshipCard,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

import {
  LuminaFlagshipSurface,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipSurface";

import type {
  KnowledgeCapsule,
} from "../capsules/types";

interface ProductionKnowledgeGraphProps {
  capsules: KnowledgeCapsule[];
  selectedCapsuleId: string;
  onCapsuleSelect(
    capsuleId: string,
    graphNodeId: string,
  ): void;
}

const STATE_TONES: Record<
  KnowledgeCapsule["state"],
  string
> = {
  queued:
    "bg-slate-400/10 text-slate-200",
  processing:
    "bg-cyan-400/10 text-cyan-100",
  waiting:
    "bg-amber-400/10 text-amber-100",
  blocked:
    "bg-rose-400/10 text-rose-100",
  failed:
    "bg-red-400/10 text-red-100",
  "needs-review":
    "bg-amber-400/12 text-amber-100",
  validated:
    "bg-violet-400/12 text-violet-100",
  approved:
    "bg-emerald-400/12 text-emerald-100",
  published:
    "bg-cyan-300/12 text-cyan-50",
  adapted:
    "bg-blue-400/10 text-blue-100",
  consumed:
    "bg-emerald-400/10 text-emerald-100",
  superseded:
    "bg-slate-400/10 text-slate-200",
  archived:
    "bg-slate-400/5 text-slate-300",
};

function getGraphNodeId(
  capsuleId: string,
) {
  return `graph-node:${capsuleId}`;
}

export function ProductionKnowledgeGraph({
  capsules,
  selectedCapsuleId,
  onCapsuleSelect,
}: ProductionKnowledgeGraphProps) {
  const edgeCount =
    Math.max(capsules.length - 1, 0);

  const toolbar = (
    <div className="grid grid-cols-3 gap-2">
      {[
        {
          label: "Nodes",
          value: String(capsules.length),
          icon: Network,
        },
        {
          label: "Edges",
          value: String(edgeCount),
          icon: GitBranch,
        },
        {
          label: "Selected",
          value: selectedCapsuleId
            ? "1"
            : "0",
          icon: Target,
        },
      ].map((metric) => (
        <LuminaFlagshipCard
          key={metric.label}
          as="article"
          className="rounded-[16px] p-3"
        >
          <div className="relative z-10 flex items-center gap-2">
            <ExecutivePremiumIcon
              icon={metric.icon}
              state="healthy"
            />

            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/60">
                {metric.label}
              </div>

              <div className="mt-1 text-sm font-semibold text-cyan-50">
                {metric.value}
              </div>
            </div>
          </div>
        </LuminaFlagshipCard>
      ))}
    </div>
  );

  return (
    <LuminaFlagshipPanel
      title="Knowledge Graph"
      description={
        <>
          The same Knowledge Packages remain visible as relationship
          nodes. Selecting a node updates the shared Production
          selection without leaving the Flow Engine.
        </>
      }
      toolbar={toolbar}
      className="overflow-hidden"
    >
      <div className="border-t border-white/[0.06] px-5 py-5 sm:px-6 sm:py-6">
        <LuminaFlagshipSurface
          className="relative max-h-[560px] overflow-auto p-0"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(125,211,252,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,.04)_1px,transparent_1px)] [background-size:32px_32px]"
          />

          <div className="relative min-w-[980px] p-5 sm:p-6">
            <div className="absolute left-[8%] right-[8%] top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />

            <div className="grid grid-cols-4 gap-8">
              {capsules.map(
                (capsule, index) => {
                  const selected =
                    capsule.id ===
                    selectedCapsuleId;

                  return (
                    <div
                      key={capsule.id}
                      className="relative"
                    >
                      {index <
                      capsules.length - 1 ? (
                        <Route
                          aria-hidden="true"
                          className="absolute -right-6 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-cyan-300/60"
                        />
                      ) : null}

                      <LuminaFlagshipCard
                        aria-pressed={selected}
                        selected={selected}
                        interactive
                        onClick={() =>
                          onCapsuleSelect(
                            capsule.id,
                            getGraphNodeId(
                              capsule.id,
                            ),
                          )
                        }
                        className={[
                          "group relative z-20 flex min-h-[210px] w-full flex-col p-4 text-left",
                          STATE_TONES[
                            capsule.state
                          ],
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-300/68">
                            {capsule.identity}
                          </div>

                          <span className="rounded-full border border-current/20 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em]">
                            {capsule.state.replace(
                              "-",
                              " ",
                            )}
                          </span>
                        </div>

                        <h3 className="mt-4 text-base font-semibold leading-5 text-amber-300">
                          {capsule.title}
                        </h3>

                        <p className="mt-2 line-clamp-3 text-xs leading-5 text-sky-200/70">
                          {capsule.summary}
                        </p>

                        <div className="mt-auto grid gap-2 pt-4 text-[10px]">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-cyan-300/55">
                              Stage
                            </span>

                            <span className="truncate font-medium text-cyan-50">
                              {capsule.stage}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="text-cyan-300/55">
                              Consumer
                            </span>

                            <span className="truncate font-medium text-cyan-50">
                              {capsule.consumer}
                            </span>
                          </div>
                        </div>
                      </LuminaFlagshipCard>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </LuminaFlagshipSurface>
      </div>
    </LuminaFlagshipPanel>
  );
}
