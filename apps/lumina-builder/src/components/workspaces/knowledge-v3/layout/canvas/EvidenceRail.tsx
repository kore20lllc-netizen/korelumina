export function EvidenceRail() {
  return (
    <aside
      className="
        rounded-[24px]
        border border-white/10
        bg-white/[0.035]
        p-5
        backdrop-blur-xl
      "
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/70">
        Evidence
      </div>

      <h3 className="mt-2 text-lg font-semibold text-white">
        Sources
      </h3>

      <div className="mt-6 space-y-3">
        {[
          "Conversations",
          "Repositories",
          "Documentation",
          "Runtime",
          "External Systems",
        ].map((item) => (
          <div
            key={item}
            className="
              rounded-xl
              border border-white/8
              bg-white/[0.03]
              px-4
              py-3
            "
          >
            <div className="text-sm text-white/80">
              {item}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
