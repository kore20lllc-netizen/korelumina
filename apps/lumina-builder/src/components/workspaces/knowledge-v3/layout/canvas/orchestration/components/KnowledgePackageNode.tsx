import { useKnowledgeSelection } from "../state/KnowledgeSelectionContext";

interface KnowledgePackageNodeProps {
  id: string;
  title: string;
  stage: string;
  confidence: number;
}

export function KnowledgePackageNode({
  id,
  title,
  stage,
  confidence,
}: KnowledgePackageNodeProps) {
  const {
    selected,
    select,
  } = useKnowledgeSelection();

  const active =
    selected?.id === id;

  return (
    <button
      type="button"
      onClick={() => select(id)}
      aria-pressed={active}
      className={[
        "group relative w-full min-w-0 overflow-hidden rounded-2xl border",
        "px-4 py-4 text-left transition-[border-color,background-color,box-shadow,transform]",
        "duration-200 ease-out focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-cyan-300/70",
        active
          ? [
              "border-cyan-300/70",
              "bg-cyan-400/[0.10]",
              "shadow-[0_0_0_1px_rgba(103,232,249,0.12),0_14px_34px_rgba(2,8,23,0.28)]",
              "-translate-y-0.5",
            ].join(" ")
          : [
              "border-white/[0.10]",
              "bg-slate-950/75",
              "shadow-[0_12px_30px_rgba(2,8,23,0.20)]",
              "hover:-translate-y-0.5",
              "hover:border-cyan-300/35",
              "hover:bg-slate-950/90",
            ].join(" "),
      ].join(" ")}
    >
      <div
        className={[
          "absolute inset-y-3 left-0 w-0.5 rounded-full transition-opacity",
          active
            ? "bg-cyan-300 opacity-100"
            : "bg-cyan-300 opacity-0 group-hover:opacity-50",
        ].join(" ")}
      />

      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.28em] text-cyan-200/75">
            {id}
          </p>

          <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-white">
            {title}
          </h3>
        </div>

        <span
          className={[
            "shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium",
            active
              ? "border-cyan-300/30 bg-cyan-300/15 text-cyan-100"
              : "border-white/[0.08] bg-white/[0.04] text-slate-300",
          ].join(" ")}
        >
          {confidence}%
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="truncate text-xs text-slate-400">
          {stage}
        </span>

        <span
          className={[
            "h-1.5 w-1.5 shrink-0 rounded-full",
            active
              ? "bg-cyan-200 shadow-[0_0_10px_rgba(103,232,249,0.9)]"
              : "bg-slate-500",
          ].join(" ")}
        />
      </div>
    </button>
  );
}
