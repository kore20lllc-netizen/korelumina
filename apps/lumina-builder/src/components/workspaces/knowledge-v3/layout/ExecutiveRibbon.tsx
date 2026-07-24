import {
  border,
  glass,
  gradients,
  radius,
  shadow,
} from "../theme/appearance";
import { ExecutiveIdentity } from "./ExecutiveIdentity";
import { ExecutiveMetrics } from "./ExecutiveMetrics";

export function ExecutiveRibbon() {
  return (
    <header
      className={[
        "group",
        "relative",
        "h-full",
        "min-w-0",
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
        aria-hidden="true"
        className={[
          "pointer-events-none",
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
          inset-x-[10%]
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
          h-full
          min-w-0
          flex-col
          px-8
          py-8
        "
      >
        <div className="min-w-0">
          <ExecutiveIdentity />
        </div>

        <div className="mt-8 min-w-0">
          <ExecutiveMetrics />
        </div>
      </div>
    </header>
  );
}
