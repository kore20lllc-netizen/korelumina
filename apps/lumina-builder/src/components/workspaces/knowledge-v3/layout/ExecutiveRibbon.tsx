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
          <ExecutiveIdentity />
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
