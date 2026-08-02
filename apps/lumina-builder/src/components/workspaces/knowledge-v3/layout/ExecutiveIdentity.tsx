import { Radio } from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

export function ExecutiveIdentity() {
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <span
          className="
            inline-flex
            items-center
            gap-3
            rounded-full shadow-[0_18px_48px_rgba(15,23,42,.30)]
            border
            border-cyan-300/10
            bg-cyan-400/5
            px-3.5
            py-1.5
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.28em]
            text-cyan-100/80
            backdrop-blur-xl
          "
        >
          <ExecutivePremiumIcon
            icon={Radio}
            state="active"
          />
          Knowledge Operations
        </span>

        <span
          className="
            rounded-full
            border
            border-emerald-300/10
            bg-emerald-400/5
            px-3.5
            py-1.5
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.24em]
            text-emerald-100/80
            backdrop-blur-xl
          "
        >
          V3
        </span>
      </div>

      <h1
        className="
          text-5xl
          font-black
          tracking-[-0.045em]
          sm:text-6xl
        "
      >
        <span className="text-gradient-lumina">
          Knowledge
        </span>{" "}
        <span
          className="
            bg-gradient-to-r
            from-[#D9A441]
            via-[#B97A18]
            to-[#7A4B05]
            bg-clip-text
            text-transparent
          "
        >
          Operations
        </span>
      </h1>

      <p
        className="
          mt-6
          max-w-2xl
          text-base
          leading-7
          text-white/78
        "
      >
        Production environment for institutional knowledge
        acquisition, evidence validation, publication,
        organizational memory, governance, and enterprise
        intelligence.
      </p>
    </>
  );
}
