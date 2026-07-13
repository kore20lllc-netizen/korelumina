export function PreviewSection() {
  return (
    <section
      className="
        rounded-[28px]
        border
        border-white/15
        bg-[rgba(12,14,24,.72)]
        p-6
        backdrop-blur-2xl
        shadow-[0_0_40px_rgba(98,76,255,.12)]
      "
    >
      <h3 className="text-base font-semibold">
        Live Preview
      </h3>

      <p className="mt-1 text-xs text-muted-foreground">
        Preview your workspace appearance.
      </p>

      <div
        className="
          mt-6
          overflow-hidden
          rounded-3xl
          border
          border-white/10
          bg-[rgba(8,10,18,.95)]
        "
      >
        <div className="h-10 border-b border-white/10 bg-white/[0.04]" />

        <div className="flex h-64">

          <div
            className="
              w-16
              border-r
              border-white/10
              bg-white/[0.03]
            "
          >
            <div className="mx-auto mt-5 h-8 w-8 rounded-xl bg-white/10" />
            <div className="mx-auto mt-4 h-8 w-8 rounded-xl bg-white/10" />
            <div className="mx-auto mt-4 h-8 w-8 rounded-xl bg-white/10" />
          </div>

          <div className="flex-1 p-6">

            <div
              className="
                h-28
                rounded-3xl
                border
                border-white/10
                bg-white/[0.05]
                shadow-[0_0_24px_rgba(120,90,255,.15)]
              "
            />

            <div className="mt-5 grid grid-cols-2 gap-5">

              <div className="h-20 rounded-2xl bg-white/[0.05]" />

              <div className="h-20 rounded-2xl bg-white/[0.05]" />

            </div>

            <div className="mt-5 flex gap-3">

              <div className="h-8 w-20 rounded-full bg-amber-300/80" />

              <div className="h-8 w-16 rounded-full bg-white/10" />

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}
