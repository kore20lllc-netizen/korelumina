import {  type KnowledgePackage,
  type KnowledgeStage,
} from "../data/knowledgePackages";
import {
  useKnowledgeSelection,
} from "../state/KnowledgeSelectionContext";

interface KnowledgeCapsuleProps {
  knowledgePackage: KnowledgePackage;
}

const stageAppearance: Record<
  KnowledgeStage,
  {
    shell: string;
    marker: string;
    text: string;
  }
> = {
  Acquire: {
    shell:
      "border-cyan-300/45 bg-cyan-400/[0.10]",
    marker:
      "bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.8)]",
    text: "text-cyan-100",
  },
  Reduce: {
    shell:
      "border-sky-300/45 bg-sky-400/[0.10]",
    marker:
      "bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,0.8)]",
    text: "text-sky-100",
  },
  Compile: {
    shell:
      "border-violet-300/45 bg-violet-400/[0.10]",
    marker:
      "bg-violet-300 shadow-[0_0_14px_rgba(196,181,253,0.8)]",
    text: "text-violet-100",
  },
  Validate: {
    shell:
      "border-amber-300/45 bg-amber-400/[0.10]",
    marker:
      "bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.8)]",
    text: "text-amber-100",
  },
  Canonical: {
    shell:
      "border-emerald-300/50 bg-emerald-400/[0.11]",
    marker:
      "bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.85)]",
    text: "text-emerald-100",
  },
};

export function KnowledgeCapsule({
  knowledgePackage,
}: KnowledgeCapsuleProps) {
  const {
    selected,
    select,
  } = useKnowledgeSelection();

  const active =
    selected?.id === knowledgePackage.id;

  const appearance =
    stageAppearance[knowledgePackage.stage];

  return (
    <article
      className="
        relative
        grid
        min-h-24
        grid-cols-[minmax(0,1fr)]
        items-center
      "
    >
      <div
        className="
          absolute
          left-[10%]
          right-[10%]
          top-1/2
          h-px
          -translate-y-1/2
          bg-white/[0.07]
        "
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={() =>
          select(knowledgePackage.id)
        }
        aria-pressed={active}
        className={[
          "relative z-10 min-w-0 justify-self-center rounded-full border",
          "px-4 py-3 text-left transition-[transform,border-color,box-shadow,background-color]",
          "duration-200 ease-out focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-white/70",
          "w-[min(100%,18rem)]",
          appearance.shell,
          active
            ? [
                "-translate-y-0.5",
                "shadow-[0_16px_38px_rgba(2,8,23,0.36)]",
                "ring-1 ring-white/20",
              ].join(" ")
            : [
                "shadow-[0_12px_28px_rgba(2,8,23,0.24)]",
                "hover:-translate-y-0.5",
              ].join(" "),
        ].join(" ")}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={[
              "h-3 w-3 shrink-0 rounded-full",
              appearance.marker,
            ].join(" ")}
          />

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <span
                className={[
                  "truncate text-[10px] font-semibold uppercase tracking-[0.25em]",
                  appearance.text,
                ].join(" ")}
              >
                {knowledgePackage.id}
              </span>

              <span className="shrink-0 text-[10px] text-white/65">
                {knowledgePackage.confidence}%
              </span>
            </div>

            <p className="mt-1 truncate text-sm font-medium text-white">
              {knowledgePackage.title}
            </p>

            <div
              className="
                mt-3
                flex
                h-1.5
                overflow-hidden
                rounded-full
                bg-black/30
              "
              aria-label={[
                `${knowledgePackage.acceptedProportion}% accepted`,
                `${knowledgePackage.discardedProportion}% removed`,
              ].join(", ")}
            >
              <span
                className="h-full bg-white/70"
                style={{
                  width:
                    `${knowledgePackage.acceptedProportion}%`,
                }}
              />

              <span
                className="h-full bg-rose-400/65"
                style={{
                  width:
                    `${knowledgePackage.discardedProportion}%`,
                }}
              />
            </div>
          </div>
        </div>
      </button>
    </article>
  );
}
