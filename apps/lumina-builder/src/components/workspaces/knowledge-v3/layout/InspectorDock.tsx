import {
  CircleHelp,
  Eye,
  Info,
  PanelRightOpen,
  Sparkles,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  border,
  glass,
  radius,
  shadow,
  executiveMaterial
} from "../theme/appearance";

interface Section {
  id: string;
  title: string;
  description: string;
}

const SECTIONS: Section[] = [
  {
    id: "selection",
    title: "Selection",
    description:
      "Knowledge object metadata will appear here.",
  },
  {
    id: "provenance",
    title: "Provenance",
    description:
      "Evidence lineage and source attribution.",
  },
  {
    id: "relationships",
    title: "Relationships",
    description:
      "Connected knowledge entities and graph links.",
  },
  {
    id: "validation",
    title: "Validation",
    description:
      "Compiler verification and publication readiness.",
  },
];

export function InspectorDock() {
  return (
    <section
      className={[
        "flex",
        "h-full",
        "flex-col",
        "overflow-hidden",
        executiveMaterial.secondary.radius,
        executiveMaterial.secondary.border,
        executiveMaterial.secondary.glass,
        executiveMaterial.secondary.shadow,
        "ring-1",
        "ring-inset",
        "ring-cyan-300/18",
        "shadow-[0_0_48px_rgba(56,189,248,.12),0_28px_72px_rgba(0,0,0,.36)]",
      ].join(" ")}
    >
      <header
        className="
          border-b
          border-white/[0.11]
          px-5
          py-5
        "
      >
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <ExecutivePremiumIcon
              icon={PanelRightOpen}
              state="active"
            />
          </div>

          <div className="min-w-0">
            <h2
              className="
                truncate
                text-sm
                font-semibold
                text-white
              "
            >
              Inspector
            </h2>

            <p
              className="
                text-xs
                text-white/45
              "
            >
              Context & Intelligence
            </p>
          </div>
        </div>
      </header>

      <div
        className="
          flex-1
          
          px-4
          py-4
        "
      >
        <div
          className={[
            "p-5",
            "border-dashed",
            executiveMaterial.tertiary.radius,
            executiveMaterial.tertiary.border,
            executiveMaterial.tertiary.glass,
            executiveMaterial.tertiary.shadow,
          ].join(" ")}
        >
          <div className="shrink-0">
            <ExecutivePremiumIcon
              icon={Eye}
              state="active"
            />
          </div>

          <h3
            className="
              mt-4
              text-base
              font-semibold
              text-white
            "
          >
            No Selection
          </h3>

          <p
            className="
              mt-3
              text-sm
              leading-6
              text-white/45
            "
          >
            Select a knowledge object to inspect
            metadata, provenance, relationships,
            validation state and publication details.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {SECTIONS.map((section) => (
            <section
              key={section.id}
              className={[
                "px-5",
                "py-5",
                executiveMaterial.tertiary.radius,
                executiveMaterial.tertiary.border,
                executiveMaterial.tertiary.glass,
                executiveMaterial.tertiary.shadow,
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <ExecutivePremiumIcon
                  icon={Info}
                  state="active"
                />

                <h4
                  className="
                    text-sm
                    font-medium
                    text-white
                  "
                >
                  {section.title}
                </h4>
              </div>

              <p
                className="
                  mt-3
                  text-xs
                  leading-6
                  text-white/45
                "
              >
                {section.description}
              </p>
            </section>
          ))}
        </div>
      </div>

            <footer
        className="
          border-t
          border-white/[0.11]
          px-5
          py-4
        "
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            <ExecutivePremiumIcon
              icon={Sparkles}
              state="warning"
            />
          </div>

          <p
            className="
              text-[11px]
              leading-5
              text-white/40
            "
          >
            Inspector capabilities expand automatically as
            Knowledge Operations milestones are implemented.
          </p>
        </div>

        <div
          className="
            mt-4
            flex
            items-center
            gap-2
            text-[11px]
            text-white/35
          "
        >
          <ExecutivePremiumIcon
            icon={CircleHelp}
            state="warning"
          />
          Milestone 1 • Shell Infrastructure
        </div>
      </footer>
    </section>
  );
}
