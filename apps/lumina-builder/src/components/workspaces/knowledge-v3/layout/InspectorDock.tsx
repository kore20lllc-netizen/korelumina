import {
  CircleHelp,
  Eye,
  Info,
  PanelRightOpen,
  Sparkles,
} from "lucide-react";

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
      className="
        flex
        h-full
        flex-col
        overflow-hidden
        rounded-[28px]
        border
        border-white/10
        bg-slate-950/42
        shadow-[0_18px_60px_rgba(0,0,0,.32),0_1px_0_rgba(255,255,255,.05)_inset]
        backdrop-blur-2xl
      "
    >
      <header
        className="
          border-b
          border-white/8
          px-5
          py-5
        "
      >
        <div className="flex items-center gap-3">
          <span
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-2xl
              border
              border-violet-300/20
              bg-violet-400/10
            "
          >
            <PanelRightOpen className="h-5 w-5 text-violet-100" />
          </span>

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
          overflow-y-auto
          px-4
          py-4
        "
      >
        <div
          className="
            rounded-2xl
            border
            border-dashed
            border-white/10
            bg-white/[0.03]
            p-5
          "
        >
          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-white/[0.05]
            "
          >
            <Eye className="h-6 w-6 text-white/60" />
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
              mt-2
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

        <div className="mt-6 space-y-3">
          {SECTIONS.map((section) => (
            <section
              key={section.id}
              className="
                rounded-2xl
                border
                border-white/8
                bg-white/[0.04]
                p-4
              "
            >
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-cyan-200/70" />

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
                  mt-2
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
          border-white/8
          px-5
          py-4
        "
      >
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 text-amber-300/70" />

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
            mt-3
            flex
            items-center
            gap-2
            text-[11px]
            text-white/35
          "
        >
          <CircleHelp className="h-3.5 w-3.5" />
          Milestone 1 • Shell Infrastructure
        </div>
      </footer>
    </section>
  );
}
