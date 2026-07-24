import { Radio } from "lucide-react";

import {
  border,
  glass,
  gradients,
  radius,
  shadow,
} from "../theme/appearance";
import { ExecutiveMetrics } from "./ExecutiveMetrics";

export function ExecutiveRibbon() {
  return (
    <header
      className={[
        "group",
        "relative",
        "overflow-hidden",
        radius.panel,
        border.hero,
        glass.hero,
        shadow.floating,
        "ring-1",
        "ring-inset",
        "ring-white/10",
      ].join(" ")}
    >
      <div
        className={[
          "absolute",
          "inset-0",
          gradients.executive,
        ].join(" ")}
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-[8%]
          top-0
          h-px
          [background:linear-gradient(90deg,transparent,rgba(247,215,116,.95),rgba(255,255,255,.92),rgba(90,200,255,.90),transparent)]
          [box-shadow:0_0_44px_rgba(90,200,255,.45),0_0_68px_rgba(247,215,116,.22)]
        "
      />

      <div
        className="
          relative
          z-10
          flex
          min-h-[172px]
          flex-col
          justify-between
          gap-8
          px-8
          py-8
          lg:flex-row
          lg:items-center
        "
      >
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-cyan-300/20
                bg-cyan-400/10
                px-3.5
                py-1.5
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.22em]
                text-cyan-100
                backdrop-blur-xl
              "
            >
              <Radio className="h-3.5 w-3.5" />
              Knowledge Operations
            </span>

            <span
              className="
                rounded-full
                border
                border-emerald-300/20
                bg-emerald-400/10
                px-3.5
                py-1.5
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-emerald-100
                backdrop-blur-xl
              "
            >
              V3
            </span>
          </div>

          <h1
            className="
              bg-gradient-to-r
              from-[#F7D774]
              via-white
              to-[#67D4FF]
              bg-clip-text
              text-4xl
              font-black
              tracking-tight
              text-transparent
              sm:text-5xl
            "
          >
            Knowledge Operations
          </h1>

          <p
            className="
              mt-5
              max-w-3xl
              text-[15px]
              leading-8
              text-white/70
            "
          >
            Production environment for institutional knowledge
            acquisition, evidence validation, publication,
            organizational memory, governance, and enterprise
            intelligence.
          </p>
        </div>

        <div
          className="
            relative
            z-10
            w-full
            lg:max-w-[720px]
          "
        >
          <ExecutiveMetrics />
        </div>
      </div>
    </header>
  );
}
