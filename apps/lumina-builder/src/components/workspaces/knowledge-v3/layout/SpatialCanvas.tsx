import {
  Focus,
  Maximize2,
  Minus,
  Move,
  Plus,
  Scan,
} from "lucide-react";

export function SpatialCanvas() {
  return (
    <section
      className="
        group
        relative
        h-full
        min-h-[560px]
        overflow-hidden
        rounded-[30px]
        border border-white/12 ring-1 ring-inset ring-white/6
        bg-slate-950/40
        shadow-[0_32px_120px_rgba(0,0,0,.42),0_1px_0_rgba(255,255,255,.05)_inset]
        backdrop-blur-2xl
      "
    >
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[radial-gradient(circle_at_20%_18%,rgba(37,99,235,0.18),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(168,85,247,0.16),transparent_26%),radial-gradient(circle_at_62%_82%,rgba(245,158,11,0.12),transparent_24%),radial-gradient(circle_at_12%_78%,rgba(6,182,212,0.12),transparent_24%)]
        "
      />

      {/* Spatial Grid */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-60
          [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]
          [background-size:40px_40px]
          [mask-image:radial-gradient(circle_at_center,black,transparent_88%)]
        "
      />

      {/* Camera Root */}
      <div className="absolute inset-0">
        {/* Viewport */}
        <div className="absolute inset-0">
          {/* Content Layer */}
          <div
            className="
              flex
              h-full
              items-center
              justify-center
              px-8
            "
          >
            <div className="max-w-lg text-center">
              <div
                className="
                  relative
                  mx-auto
                  flex
                  h-28
                  w-28
                  items-center
                  justify-center
                  rounded-[32px]
                  border border-white/12 ring-1 ring-inset ring-white/6
                  bg-white/[0.05]
                "
              >
                <div
                  className="
                    absolute
                    inset-3
                    rounded-[24px]
                    border border-cyan-300/10
                    bg-gradient-to-br
                    from-blue-500/10
                    via-violet-500/10
                    to-amber-500/10
                  "
                />

                <Focus
                  className="
                    relative
                    h-8
                    w-8
                    text-amber-300
                    drop-shadow-[0_0_18px_rgba(245,158,11,.25)]
                  "
                />
              </div>

              <h2
                className="
                  mt-8
                  text-2xl
                  font-semibold
                  tracking-[-0.03em]
                  text-white
                "
              >
                Spatial Knowledge Environment
              </h2>

              <p
                className="
                  mt-3
                  text-sm
                  leading-7
                  text-white/45
                "
              >
                This persistent spatial surface will host evidence,
                knowledge objects, provenance, validation,
                organizational memory and compiler output without
                requiring structural redesign.
              </p>
            </div>
          </div>

          {/* Overlay Layer */}
          <div
            className="
              absolute
              left-5
              top-5
              flex
              items-center
              gap-2
              rounded-2xl
              border border-white/12 ring-1 ring-inset ring-white/6
              bg-slate-950/65
              px-3
              py-2
              backdrop-blur-xl
            "
          >
            <Scan className="h-4 w-4 text-cyan-300" />

            <div>
              <div
                className="
                  text-[10px]
                  uppercase
                  tracking-[0.15em]
                  text-white/40
                "
              >
                Canvas
              </div>

              <div
                className="
                  text-xs
                  font-medium
                  text-white/80
                "
              >
                Camera Ready
              </div>
            </div>
          </div>

          {/* HUD */}
          <div
            className="
              absolute
              bottom-5
              left-5
              flex
              items-center
              gap-1
              rounded-2xl
              border border-white/12 ring-1 ring-inset ring-white/6
              bg-slate-950/70
              p-1.5
              backdrop-blur-xl
            "
          >
            <button
              type="button"
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-xl
                hover:bg-white/10
                transition
              "
            >
              <Minus className="h-4 w-4 text-white/60" />
            </button>

            <span
              className="
                min-w-[48px]
                text-center
                text-[11px]
                font-semibold
                text-white/45
              "
            >
              100%
            </span>

            <button
              type="button"
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-xl
                hover:bg-white/10
                transition
              "
            >
              <Plus className="h-4 w-4 text-white/60" />
            </button>

            <span className="mx-1 h-5 w-px bg-white/10" />

            <button
              type="button"
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-xl
                hover:bg-white/10
                transition
              "
            >
              <Move className="h-4 w-4 text-white/60" />
            </button>

            <button
              type="button"
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-xl
                hover:bg-white/10
                transition
              "
            >
              <Maximize2 className="h-4 w-4 text-white/60" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
