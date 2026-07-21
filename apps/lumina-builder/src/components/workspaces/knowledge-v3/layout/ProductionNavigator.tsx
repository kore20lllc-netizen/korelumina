import { useState } from "react";
import type { LucideIcon } from "lucide-react";

import {
  glass,
  border,
  shadow,
  radius,
} from "../theme/appearance";
import {
  Archive,
  Binary,
  Boxes,
  Braces,
  CheckCheck,
  Database,
  FileSearch,
  GitBranch,
  LibraryBig,
} from "lucide-react";

type StageStatus =
  | "complete"
  | "active"
  | "waiting"
  | "blocked";

interface Stage {
  id: string;
  label: string;
  icon: LucideIcon;
  status: StageStatus;
}



const STAGES: Stage[] = [
  {
    id: "sources",
    status: "active",
    label: "Sources",
    icon: Database,
  },
  {
    id: "acquisition",
    status: "waiting",
    label: "Acquisition",
    icon: Archive,
  },
  {
    id: "evidence",
    status: "waiting",
    label: "Evidence",
    icon: FileSearch,
  },
  {
    id: "compiler",
    status: "waiting",
    label: "Knowledge Compiler",
    icon: Binary,
  },
  {
    id: "ir",
    status: "waiting",
    label: "Knowledge IR",
    icon: Braces,
  },
  {
    id: "validation",
    status: "waiting",
    label: "Validation",
    icon: CheckCheck,
  },
  {
    id: "canonical",
    status: "waiting",
    label: "Canonical Knowledge",
    icon: LibraryBig,
  },
  {
    id: "graph",
    status: "waiting",
    label: "Knowledge Graph",
    icon: GitBranch,
  },
  {
    id: "memory",
    status: "waiting",
    label: "Organizational Memory",
    icon: Boxes,
  },
];


interface ProductionPipeline {
  stages: Stage[];
}

const DEFAULT_PIPELINE: ProductionPipeline = {
  stages: STAGES,
};


const CARD_SURFACE =
  `${radius.card} border transition-all duration-200`;

const ICON_SURFACE =
  "flex h-10 w-10 items-center justify-center rounded-xl";


function getStageSurface(active: boolean) {
  return active
    ? `${glass.floating} ${border.hero} ${shadow.hero}`
    : `${glass.panel} ${border.panel} ${shadow.panel}`;
}

function getStageIconSurface(active: boolean) {
  return active
    ? `${glass.hero} text-white`
    : `${glass.floating} text-white/72`;
}



export function ProductionNavigator() {
  const [selected, setSelected] = useState("sources");

  return (
    <nav
      aria-label="Knowledge Production Pipeline"
      className={`
        ${radius.panel}
        ${glass.panel}
        ${border.panel}
        ${shadow.panel}
        ring-1 ring-inset ring-white/6
        p-3
      `}
    >
      <div
        className="
          flex
          gap-2
          overflow-x-auto
          pb-1
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {DEFAULT_PIPELINE.stages.map((stage) => {
          const Icon = stage.icon;

          const status = stage.status;

          const complete =
            status === "complete";

          const active =
            status === "active";

          const blocked =
            status === "blocked";

          const selectedStage =
            stage.id === selected;

          const cardClass =
            complete
              ? "border-emerald-300/25 bg-emerald-400/8"
              : active
                ? "border-cyan-300/30 bg-cyan-400/10"
                : blocked
                  ? "border-amber-300/25 bg-amber-400/8"
                  : "border-white/8 bg-white/[0.04] hover:border-white/15 hover:bg-white/[0.07]";

          const iconClass =
            complete
              ? "bg-emerald-400/15 text-emerald-100"
              : active
                ? "bg-cyan-400/15 text-cyan-100"
                : blocked
                  ? "bg-amber-400/15 text-amber-100"
                  : "bg-white/6 text-white/65";

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setSelected(stage.id)}
              className={`
                ${CARD_SURFACE}
                group
                flex
                min-w-[150px]
                flex-col
                gap-3
                px-4
                py-4
                text-left
                ${cardClass}
              `}
            >
              <span
                className={`
                  ${ICON_SURFACE}
                  ${iconClass}
                `}
              >
                <Icon className="h-5 w-5" />
              </span>

              <div>
                <div
                  className={`
                    text-sm
                    font-semibold
                    ${
                      active
                        ? "text-white"
                        : "text-white/82"
                    }
                  `}
                >
                  {stage.label}
                </div>

                <div
                  className="
                    mt-1
                    text-[11px]
                    uppercase
                    tracking-[0.14em]
                    text-white/38
                  "
                >
                  Pipeline Stage
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
