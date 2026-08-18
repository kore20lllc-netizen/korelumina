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
  buildPipelinePresentation,
} from "../presentation/buildPipelinePresentation";

import { KnowledgeCapsule } from "./KnowledgeCapsule";
import { KnowledgeFragmentBranches } from "./KnowledgeFragmentBranches";

export function KnowledgeFlowLane() {
  
  const presentation =
  buildPipelinePresentation();

const routedPackages =
  presentation.packages;

const routeSegments =
  presentation.routes;

const STAGE_BANDS = [
  {
    name: "Acquire",
    left: "10%",
    width: "16%",
    color: "from-cyan-500/10",
  },
  {
    name: "Reduce",
    left: "26%",
    width: "16%",
    color: "from-blue-500/10",
  },
  {
    name: "Compile",
    left: "42%",
    width: "16%",
    color: "from-violet-500/10",
  },
  {
    name: "Validate",
    left: "58%",
    width: "16%",
    color: "from-amber-500/10",
  },
  {
    name: "Canonical",
    left: "74%",
    width: "16%",
    color: "from-emerald-500/10",
  },
];

const pipelineCompletion =
  Math.max(
    ...routedPackages.map(
      (pkg) => pkg.progress,
    ),
  );

return (
    <div className="relative">

      {/* Stage Header */}

      <div className="relative h-20">

        <div className="absolute left-[10%] right-[10%] top-10 h-px bg-cyan-400/25" />

        {KNOWLEDGE_STAGES.map((stage) => (
          <div
            key={stage}
            className="absolute -translate-x-1/2"
            style={{
              left:
                stage === "Acquire"
                  ? "10%"
                  : stage === "Reduce"
                    ? "30%"
                    : stage === "Compile"
                      ? "50%"
                      : stage === "Validate"
                        ? "70%"
                        : "90%",
            }}
          >
            <div
              className="
                h-4
                w-4
                rounded-full
                border
                border-cyan-300/40
                bg-slate-950
                shadow-[0_0_20px_rgba(34,211,238,.25)]
              "
            />

            <div
              className="
                mt-3
                whitespace-nowrap
                rounded-full
                border
                border-white/[0.08]
                bg-slate-950/90
                px-3
                py-1
                text-[10px]
                uppercase
                tracking-[0.28em]
                text-slate-300
              "
            >
              {stage}
            </div>
          </div>
        ))}
      </div>

      {/* Package Tracks */}

      <div className="space-y-10">

        {KNOWLEDGE_PACKAGES.map((pkg) => (

          <div
            key={pkg.id}
            className="relative h-32"
          >

            <div
              className="
                absolute
                left-[10%]
                right-[10%]
                top-10
                h-px
                border-t
                border-dashed
                border-white/10
              "
            />

            <div
              className="absolute top-0 -translate-x-1/2"
              style={{
                left: `${10 + pkg.progress * 80}%`,
              }}
            >
              <KnowledgeCapsule
                knowledgePackage={pkg}
              />
            </div>

            <div className="absolute left-0 right-0 top-16">

              <KnowledgeFragmentBranches
                knowledgePackage={pkg}
              />

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}
