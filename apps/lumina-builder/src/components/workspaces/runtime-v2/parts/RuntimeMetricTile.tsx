import {
  createElement,
  isValidElement,
  type ReactNode,
} from "react";

import type {
  LucideIcon,
  LucideProps,
} from "lucide-react";

import {
  LuminaMetricCard,
} from "@/components/lumina/workspace";

import {
  cn,
} from "@/lib/utils";

import {
  RuntimeSparkline,
  type RuntimeTelemetryMode,
} from "./RuntimeSparkline";

type RuntimeMetricIcon =
  | LucideIcon
  | ReactNode;

type RuntimeMetricAccent =
  | "violet"
  | "magenta"
  | "cyan"
  | "gold";

export interface RuntimeMetricTileProps {
  label: string;
  value: ReactNode;
  footer?: ReactNode;
  icon?: RuntimeMetricIcon;
  accent?: RuntimeMetricAccent;
  visualization?: RuntimeTelemetryMode;
  trend?: number[];
  className?: string;
}

const ACCENT_STROKE: Record<
  RuntimeMetricAccent,
  string
> = {
  violet:
    "hsl(var(--violet))",

  magenta:
    "hsl(var(--magenta))",

  cyan:
    "hsl(var(--cyan))",

  gold:
    "hsl(var(--gold))",
};

const ACCENT_FILL: Record<
  RuntimeMetricAccent,
  string
> = {
  violet:
    "hsl(var(--violet) / 0.18)",

  magenta:
    "hsl(var(--magenta) / 0.18)",

  cyan:
    "hsl(var(--cyan) / 0.18)",

  gold:
    "hsl(var(--gold) / 0.18)",
};

const ACCENT_ICON_CLASS: Record<
  RuntimeMetricAccent,
  string
> = {
  violet:
    "text-violet",

  magenta:
    "text-magenta",

  cyan:
    "text-cyan",

  gold:
    "text-gold",
};

const ACCENT_GLOW_CLASS: Record<
  RuntimeMetricAccent,
  string
> = {
  violet: [
    "bg-violet/16",
    "shadow-[0_0_38px_hsl(var(--violet)/0.18)]",
  ].join(" "),

  magenta: [
    "bg-magenta/16",
    "shadow-[0_0_38px_hsl(var(--magenta)/0.18)]",
  ].join(" "),

  cyan: [
    "bg-cyan/16",
    "shadow-[0_0_38px_hsl(var(--cyan)/0.18)]",
  ].join(" "),

  gold: [
    "bg-gold/16",
    "shadow-[0_0_38px_hsl(var(--gold)/0.18)]",
  ].join(" "),
};

const ACCENT_BORDER_CLASS: Record<
  RuntimeMetricAccent,
  string
> = {
  violet:
    "border-violet/20",

  magenta:
    "border-magenta/20",

  cyan:
    "border-cyan/20",

  gold:
    "border-gold/20",
};

const ACCENT_LINE_CLASS: Record<
  RuntimeMetricAccent,
  string
> = {
  violet:
    "from-violet/70",

  magenta:
    "from-magenta/70",

  cyan:
    "from-cyan/70",

  gold:
    "from-gold/70",
};

function renderMetricIcon(
  icon: RuntimeMetricIcon | undefined,
  accent: RuntimeMetricAccent,
): ReactNode {
  if (
    icon == null ||
    typeof icon === "boolean"
  ) {
    return null;
  }

  const renderedIcon =
    isValidElement(icon) ||
    typeof icon === "string" ||
    typeof icon === "number"
      ? icon
      : createElement(
          icon as LucideIcon,
          {
            className: cn(
              "h-5 w-5",
              ACCENT_ICON_CLASS[
                accent
              ],
            ),
            strokeWidth: 1.75,
          } satisfies LucideProps,
        );

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 rounded-xl blur-xl",
          ACCENT_GLOW_CLASS[
            accent
          ],
        )}
      />

      <div
        aria-hidden="true"
        className="absolute inset-[1px] rounded-[11px] bg-gradient-to-br from-white/[0.12] via-white/[0.035] to-transparent"
      />

      <div className="relative flex items-center justify-center">
        {renderedIcon}
      </div>
    </div>
  );
}

function RuntimeTelemetryFooter({
  footer,
  accent,
}: {
  footer: ReactNode;
  accent: RuntimeMetricAccent;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden="true"
          className={cn(
            "relative flex h-2 w-2 shrink-0 rounded-full",
            ACCENT_GLOW_CLASS[
              accent
            ],
          )}
        >
          <span className="absolute inset-0 animate-ping rounded-full opacity-35" />

          <span className="relative h-2 w-2 rounded-full bg-current" />
        </span>

        <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/55">
          Live
        </span>
      </div>

      <div className="min-w-0 truncate text-right text-[11px] font-medium text-muted-foreground">
        {footer}
      </div>
    </div>
  );
}

export function RuntimeMetricTile({
  label,
  value,
  footer,
  icon,
  accent = "violet",
  visualization = "signal",
  trend,
  className,
}: RuntimeMetricTileProps) {
  const renderedIcon =
    renderMetricIcon(
      icon,
      accent,
    );

  const hasTrend =
    Boolean(
      trend?.length,
    );

  return (
    <div
      className={cn(
        "group relative h-full",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -inset-x-3 -top-10 h-24 rounded-full blur-3xl",
          "opacity-45 transition-opacity duration-500 group-hover:opacity-65",
          ACCENT_GLOW_CLASS[
            accent
          ],
        )}
      />

      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-6 top-0 z-10 h-px",
          "bg-gradient-to-r to-transparent",
          ACCENT_LINE_CLASS[
            accent
          ],
        )}
      />

      <LuminaMetricCard
        className={cn(
          "relative min-h-[172px]",
          "border",
          ACCENT_BORDER_CLASS[
            accent
          ],
          "shadow-[0_22px_70px_rgba(0,0,0,0.24)]",
          "transition-[transform,box-shadow,border-color]",
          "duration-300 ease-out",
          "group-hover:-translate-y-0.5",
          "group-hover:shadow-[0_28px_90px_rgba(0,0,0,0.32)]",
        )}
        label={
          <span className="text-white/62">
            {label}
          </span>
        }
        value={
          <div className="flex min-h-[48px] items-end">
            <div className="w-full text-[36px] font-semibold leading-none tracking-[-0.045em] text-white tabular-nums">
              {value}
            </div>
          </div>
        }
        icon={renderedIcon}
        accent={
          hasTrend ? (
            <div className="relative -mx-1 overflow-hidden rounded-xl border border-white/[0.055] bg-black/[0.08] px-1.5 pb-0.5 pt-1">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
              />

              <RuntimeSparkline
                data={
                  trend ?? []
                }
                mode={
                  visualization
                }
                width={260}
                height={44}
                stroke={
                  ACCENT_STROKE[
                    accent
                  ]
                }
                fill={
                  ACCENT_FILL[
                    accent
                  ]
                }
                className="h-[54px] w-full"
                label={`${label} telemetry`}
              />
            </div>
          ) : (
            <div className="h-[54px]" />
          )
        }
        footer={
          footer ? (
            <RuntimeTelemetryFooter
              footer={footer}
              accent={accent}
            />
          ) : undefined
        }
      />
    </div>
  );
}

export default RuntimeMetricTile;
