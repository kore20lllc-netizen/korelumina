import {
  executiveMaterial,
  gradients,
  lighting,
} from "../theme/appearance";
import { ExecutiveIdentity } from "./ExecutiveIdentity";
import { ExecutiveMetrics } from "./ExecutiveMetrics";
import { ExecutiveOperationsDeck } from "./ExecutiveOperationsDeck";

export function ExecutiveRibbon() {
  return (
    <header
      className={[
        "group",
        "relative",
        "h-full",
        "min-w-0",
        "overflow-hidden",
        executiveMaterial.hero.radius,
        executiveMaterial.hero.border,
        executiveMaterial.hero.glass,
        executiveMaterial.hero.shadow,
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
        className={lighting.executiveReflection}
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

        <div className="mt-7 min-w-0">
          <ExecutiveOperationsDeck />
        </div>

        <div className="mt-7 min-w-0">
          <ExecutiveMetrics />
        </div>
      </div>
    </header>
  );
}
