export default function Hero() {
  return (
    <section className="relative h-screen w-full bg-black flex items-center justify-center">

      {/* blob */}
      <img
        src="/lumina.png"
        className="absolute left-1/2 top-1/2 h-[96vh] min-w-[74vw] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-55 pointer-events-none select-none"
      />

      {/* shared translucent frame */}
      <div
        className="
          absolute left-1/2 top-1/2
          -translate-x-1/2 -translate-y-1/2
          w-[86vw] max-w-[1180px]
          rounded-[28px]
          border border-white/10
          bg-[linear-gradient(140deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015))]
          shadow-[0_60px_160px_rgba(0,0,0,0.82)]
          overflow-hidden
        "
      >
        <div className="grid grid-cols-[1.05fr_0.95fr] items-center gap-14 px-16 py-14">

          {/* left copy */}
          <div>
            <h1 className="text-[64px] leading-[1.02] tracking-[-0.03em] font-bold text-white">
              Build apps with AI —
              <br />
              preview before
              <br />
              anything is applied.
            </h1>

            <p className="mt-8 text-[18px] leading-8 text-white/70 max-w-[560px]">
              Kore Lumina plans your app, shows every change, and lets you preview safely.
              Nothing runs unless you approve.
            </p>

            <div className="mt-10 flex gap-5">
              <a
                href="/builder"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#4A90E2] to-[#C85BFF] text-white font-semibold"
              >
                Start building
              </a>

              <a
                href="#how-it-works"
                className="px-8 py-4 rounded-xl border border-white/15 text-white"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* right video */}
          <div className="relative">
            <div
              className="
                relative aspect-[16/10] w-full
                rounded-[22px]
                bg-white/[0.02]
                ring-1 ring-white/10
                overflow-hidden
              "
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/[0.06] via-transparent to-white/[0.05] pointer-events-none z-10" />

              <video
                autoPlay
                muted
                loop
                playsInline
                className="
                  absolute left-1/2 top-1/2
                  h-full w-auto min-w-[180%]
                  -translate-x-1/2 -translate-y-1/2
                  object-cover
                "
              >
                <source src="/hero-build-reel.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

        </div>
      </div>

    </section>
  );
}
