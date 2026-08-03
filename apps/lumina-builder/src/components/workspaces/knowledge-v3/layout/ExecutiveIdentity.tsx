import {
  Radio,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";
import {
  LuminaExecutiveIdentity,
} from "@/components/design-system/lumina";

export function ExecutiveIdentity() {
  return (
    <LuminaExecutiveIdentity
      eyebrow={
        <span className="inline-flex items-center gap-3 rounded-full border border-cyan-300/10 bg-cyan-400/5 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-100/80 shadow-[0_18px_48px_rgba(15,23,42,.30)] backdrop-blur-xl">
          <ExecutivePremiumIcon
            icon={Radio}
            state="active"
          />
          Knowledge Operations
        </span>
      }
      badge={
        <span className="rounded-full border border-emerald-300/10 bg-emerald-400/5 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-100/80 backdrop-blur-xl">
          V3
        </span>
      }
      titlePrimary="Knowledge"
      titleSecondary="Operations"
      description={
        <>
          Production environment for institutional knowledge
          acquisition, evidence validation, publication,
          organizational memory, governance, and enterprise
          intelligence.
        </>
      }
    />
  );
}
