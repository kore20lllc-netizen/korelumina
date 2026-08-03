import {
  RadioTower,
} from "lucide-react";

import {
  LuminaExecutiveOperationsDeck,
} from "@/components/design-system/lumina";

import {
  ExecutiveOperationRow,
} from "./ExecutiveOperationRow";
import {
  useExecutiveOperations,
} from "./useExecutiveOperations";

export function ExecutiveOperationsDeck() {
  const operations =
    useExecutiveOperations();

  return (
    <LuminaExecutiveOperationsDeck
      ariaLabel="Executive operations status"
      icon={
        <RadioTower
          aria-hidden="true"
          className="h-3.5 w-3.5"
          strokeWidth={1.8}
        />
      }
      title="Operational heartbeat"
      description="Institutional systems state"
      status={
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.15em] text-emerald-100">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,.35)]"
          />
          Nominal
        </span>
      }
    >
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
    </LuminaExecutiveOperationsDeck>
  );
}
