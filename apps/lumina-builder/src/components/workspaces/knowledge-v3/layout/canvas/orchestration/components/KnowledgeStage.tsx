interface KnowledgeStageProps {
  title: string;
  count: number;
}

export function KnowledgeStage({
  title,
  count,
}: KnowledgeStageProps) {
  return (
    <div
      className="
        flex
        w-40
        flex-col
        items-center
        rounded-2xl
        border
        border-white/10
        bg-white/[0.03]
        px-4
        py-5
        backdrop-blur-xl
      "
    >
      <div className="text-[11px] uppercase tracking-[0.35em] text-slate-400">
        {title}
      </div>

      <div className="mt-3 text-3xl font-semibold text-white">
        {count}
      </div>
    </div>
  );
}
