import { RadioTower } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExecutiveOperationRow } from "./ExecutiveOperationRow";
import { useExecutiveOperations } from "./useExecutiveOperations";
import {
  executiveMaterial,
  gradients,
  lighting,
} from "../theme/appearance";

export function ExecutiveOperationsDeck() {
  const operations = useExecutiveOperations();

  return (
    <section
      aria-label="Executive operations status"
      className={cn(
        "group/deck relative min-w-0 overflow-hidden transition-all duration-500",
        executiveMaterial.primary.radius,
        executiveMaterial.primary.border,
        executiveMaterial.primary.glass,
        executiveMaterial.primary.shadow,
      )}>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0",
          gradients.executiveAmbient,
        )}
      />

      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-[9%] top-0 h-px",
          lighting.executiveReflection,
        )}
      />

      <div className="relative z-10">
        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            border-b
            border-white/[0.06]
            px-4
            py-3
          "
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="
                flex
                h-7
                w-7
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-white/[0.10]
                bg-white/[0.04]
                text-white/85
                shadow-[inset_0_1px_0_rgba(255,255,255,.05)]
              "
            >
              <RadioTower
                aria-hidden="true"
                className="h-3.5 w-3.5"
                strokeWidth={1.8}
              />
            </div>

            <div className="min-w-0">
              <p
                className="
                  truncate
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.18em]
                  text-white/74
                "
              >
                Operational heartbeat
              </p>

              <p
                className="
                  mt-0.5
                  truncate
                  text-[9px]
                  tracking-[0.015em]
                  text-white/36
                "
              >
                Institutional systems state
              </p>
            </div>
          </div>

          <span
            className="
              inline-flex
              shrink-0
              items-center
              gap-1.5
              rounded-full
              border
              border-white/[0.08]
              bg-white/[0.04]
              px-2.5
              py-1
              text-[8px]
              font-semibold
              uppercase
              tracking-[0.15em]
              text-emerald-100
            "
          >
            <span
              aria-hidden="true"
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-emerald-300
                shadow-[0_0_8px_rgba(110,231,183,.35)]
              "
            />
            Nominal
          </span>
        </div>

        <div>
          {operations.map(
            (operation, index) => (
              <ExecutiveOperationRow
                key={operation.id}
                operation={operation}
                isLast={
                  index ===
                  operations.length - 1
                }
              />
            ),
          )}
        </div>
      </div>
    </section>
  );
}
