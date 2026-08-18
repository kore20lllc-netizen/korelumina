import { cn } from "@/lib/utils";

export interface LuminaSegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
  activeClassName?: string;
  dotClassName?: string;
}

export type LuminaSegmentedControlVariant =
  | "surface"
  | "glass";

interface LuminaSegmentedControlProps<T extends string> {
  value: T;
  options: LuminaSegmentOption<T>[];
  onValueChange: (value: T) => void;
  className?: string;
  variant?: LuminaSegmentedControlVariant;
  "aria-label"?: string;
}

const CONTAINER_CLASSES: Record<
  LuminaSegmentedControlVariant,
  string[]
> = {
  surface: [
    "flex w-full flex-wrap items-center gap-1.5 rounded-2xl",
    "sm:flex-nowrap",
    "border",
    "[border-color:var(--lumina-border-standard)]",
    "[background:var(--lumina-surface-interactive)]",
    "[backdrop-filter:var(--lumina-blur-surface)]",
    "[box-shadow:var(--lumina-shadow-panel)]",
    "p-1.5",
  ],

  glass: [
    "flex flex-nowrap items-center gap-1.5 rounded-xl",
    "[border-color:var(--lumina-border-standard)] border",
    "[background:var(--lumina-surface-interactive)]",
    "[backdrop-filter:var(--lumina-blur-surface)]",
    "[box-shadow:var(--lumina-shadow-panel)]",
    "p-1",
  ],
};

const ACTIVE_CLASSES: Record<
  LuminaSegmentedControlVariant,
  string[]
> = {
  surface: [
    "[border-color:var(--lumina-border-emphasis)]",
    "[background:var(--lumina-surface-selected)]",
    "[box-shadow:var(--lumina-shadow-selected)]",
    "text-white",
    "-translate-y-[1px]",
  ],

  glass: [
    "border-white/30",
    "bg-white/[0.18]",
    "text-white",
    "-translate-y-px",
    "shadow-[0_0_22px_rgba(168,85,247,0.24),0_12px_30px_rgba(0,0,0,0.22)]",
  ],
};

const INACTIVE_CLASSES: Record<
  LuminaSegmentedControlVariant,
  string[]
> = {
  surface: [
    "border-transparent",
    "bg-transparent",
    "text-foreground/55",
    "hover:text-white",
    "hover:[background:var(--lumina-surface-interactive)]",
    "hover:[border-color:var(--lumina-border-standard)]",
  ],

  glass: [
    "border-transparent",
    "bg-transparent",
    "text-foreground/60",
    "hover:text-white",
    "hover:border-white/20",
    "hover:bg-white/[0.10]",
    "hover:-translate-y-px",
  ],
};

const BUTTON_LAYOUT: Record<
  LuminaSegmentedControlVariant,
  string[]
> = {
  surface: [
    "inline-flex min-w-0 flex-1 items-center justify-center gap-2",
    "sm:flex-none sm:flex-initial",
    "h-9 rounded-lg px-3",
  ],

  glass: [
    "inline-flex flex-none items-center justify-center gap-1.5",
    "min-w-0 whitespace-nowrap",
    "h-9 rounded-lg px-3",
  ],
};

const LABEL_CLASSES: Record<
  LuminaSegmentedControlVariant,
  string
> = {
  surface: "truncate",
  glass: "whitespace-nowrap",
};

export function LuminaSegmentedControl<T extends string>({
  value,
  options,
  onValueChange,
  className,
  variant = "surface",
  ...props
}: LuminaSegmentedControlProps<T>) {
  return (
    <div
      role="group"
      className={cn(
        ...CONTAINER_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "group relative overflow-hidden",
              ...BUTTON_LAYOUT[variant],
              "text-center",
              "break-keep",
              "text-[11px] font-medium uppercase tracking-[0.16em]",
              "transition-all duration-200",
              "border",
              active
                ? cn(
                    option.activeClassName,
                    ...ACTIVE_CLASSES[variant],
                  )
                : cn(
                    ...INACTIVE_CLASSES[variant],
                  ),
            )}
          >
            {option.dotClassName && (
              <span
                className={cn(
                  variant === "glass"
                    ? "h-2.5 w-2.5"
                    : "h-2 w-2",
                  "rounded-full transition-all duration-200",
                  option.dotClassName,
                  active
                    ? "opacity-100 scale-110 [filter:drop-shadow(var(--lumina-glow-surface))]"
                    : "opacity-55",
                )}
              />
            )}

            <span className={LABEL_CLASSES[variant]}>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
