export function PipelineViewport() {
  return (
    <main
      className="
        rounded-[28px]
        border border-cyan-400/12
        bg-slate-950/55
        p-6
        backdrop-blur-2xl
      "
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/70">
        Knowledge Production
      </div>

      <h2 className="mt-2 text-2xl font-semibold text-white">
        Processing Pipeline
      </h2>

      <div className="mt-8 space-y-4">
        {[
          "Acquisition",
          "Knowledge IR",
          "Reduction",
          "Compilation",
          "Validation",
          "Canonicalization",
        ].map((stage, index) => (
          <div
            key={stage}
            className="
              flex
              items-center
              gap-4
              rounded-2xl
              border border-white/8
              bg-white/[0.03]
              px-5
              py-4
            "
          >
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                border border-cyan-300/20
                bg-cyan-300/10
                text-sm
                font-semibold
                text-cyan-200
              "
            >
              {index + 1}
            </div>

            <div>
              <div className="text-base font-medium text-white">
                {stage}
              </div>

              <div className="mt-1 text-sm text-white/45">
                Production stage
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
