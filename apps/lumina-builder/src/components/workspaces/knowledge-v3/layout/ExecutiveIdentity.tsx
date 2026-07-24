import { Radio } from "lucide-react";

export function ExecutiveIdentity() {
  return (
    <>
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
    </>
  );
}
