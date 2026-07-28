export function KnowledgeWorkspaceHeader() {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan">
          Production Pipeline
        </div>

        <h2 className="mt-3 text-2xl font-semibold text-cyan">
          Institutional Knowledge Production
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
          Acquire, validate, compile, and operationalize institutional
          knowledge.
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">
          Runtime
        </div>

        <div className="mt-1 text-sm font-semibold text-emerald-300">
          Operational
        </div>
      </div>
    </div>
  );
}
