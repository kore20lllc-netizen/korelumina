import type {
  ExecutiveOperation,
  ExecutiveOperationState,
} from "./executiveOperations";
import { getExecutiveOperationIcon } from "./ExecutiveOperationIcons";
import { ExecutivePremiumIcon } from "@/components/design-system/executive/ExecutivePremiumIcon";

interface ExecutiveOperationRowProps {
  operation: ExecutiveOperation;
  isLast: boolean;
}

const STATE_STYLES: Record<
  ExecutiveOperationState,
  {
    indicator: string;
    status: string;
    icon: string;
  }
> = {
  healthy: {
    indicator:
      "bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,.82)]",
    status: "text-emerald-100",
    icon:
      "border-emerald-300/15 bg-emerald-300/[0.07] text-emerald-100",
  },
  active: {
    indicator:
      "bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,.82)]",
    status: "text-cyan-100",
    icon:
      "border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-100",
  },
  warning: {
    indicator:
      "bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,.80)]",
    status: "text-amber-100",
    icon:
      "border-amber-300/15 bg-amber-300/[0.07] text-amber-100",
  },
  error: {
    indicator:
      "bg-rose-300 shadow-[0_0_14px_rgba(253,164,175,.80)]",
    status: "text-rose-100",
    icon:
      "border-rose-300/15 bg-rose-300/[0.07] text-rose-100",
  },
};

export function ExecutiveOperationRow({
  operation,
  isLast,
}: ExecutiveOperationRowProps) {
  const Icon = getExecutiveOperationIcon(operation.icon);
  const state = STATE_STYLES[operation.state];

  return (
    <div
      className={[
        "group/operation",
        "relative",
        "grid",
        "min-w-0",
        "grid-cols-[34px_minmax(0,1fr)_auto]",
        "items-center",
        "gap-3",
        "px-3.5",
        "py-2.5",
        "transition-all",
        "duration-300",
        "hover:bg-white/[0.035]",
        !isLast ? "border-b border-white/[0.055]" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ExecutivePremiumIcon
        icon={Icon}
        state={operation.state}
      />

      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className={[
              "relative",
              "h-1.5",
              "w-1.5",
              "shrink-0",
              "rounded-full",
              state.indicator,
            ].join(" ")}
          >
            <span
              className="
                absolute
                inset-[-4px]
                animate-pulse
                rounded-full
                bg-current
                opacity-15
              "
            />
          </span>

          <span
            className="
              truncate
              text-[11px]
              font-semibold
              tracking-[0.01em]
              text-white/90
            "
          >
            {operation.label}
          </span>
        </div>

        <p
          className="
            mt-0.5
            truncate
            pl-3.5
            text-[9px]
            leading-4
            tracking-[0.015em]
            text-white/38
          "
        >
          {operation.detail}
        </p>
      </div>

      <span
        className={[
          "shrink-0",
          "rounded-full",
          "border",
          "border-white/[0.07]",
          "bg-black/20",
          "px-2.5",
          "py-1",
          "text-[9px]",
          "font-semibold",
          "uppercase",
          "tracking-[0.13em]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,.04)]",
          state.status,
        ].join(" ")}
      >
        {operation.status}
      </span>
    </div>
  );
}
