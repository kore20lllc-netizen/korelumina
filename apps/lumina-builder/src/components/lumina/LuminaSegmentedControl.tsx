import { cn } from "@/lib/utils";

export interface LuminaSegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
  activeClassName?: string;
  dotClassName?: string;
}

interface LuminaSegmentedControlProps<T extends string> {
  value: T;
  options: LuminaSegmentOption<T>[];
  onValueChange: (value: T) => void;
  className?: string;
  "aria-label"?: string;
}

export function LuminaSegmentedControl<T extends string>({
  value,
  options,
  onValueChange,
  className,
  ...props
}: LuminaSegmentedControlProps<T>) {
  return (
    <div
      role="group"
      className={cn(
        "inline-flex items-center gap-1 rounded-2xl",
        "border",
        "[border-color:var(--lumina-border-standard)]",
        "[background:var(--lumina-surface-interactive)]",
        "[backdrop-filter:var(--lumina-blur-surface)]",
        "[box-shadow:var(--lumina-shadow-panel)]",
        "p-1",
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
              "inline-flex items-center gap-2",
              "h-9 px-4 rounded-xl",
              "text-[11px] font-medium uppercase tracking-[0.16em]",
              "transition-all duration-200",
              "border",
              active
                ? cn(
                    option.activeClassName,
                    "[border-color:var(--lumina-border-emphasis)]",
                    "[background:var(--lumina-surface-selected)]",
                    "[box-shadow:var(--lumina-shadow-selected)]",
                    "text-white",
                    "-translate-y-[1px]",
                  )
                : cn(
                    "border-transparent",
                    "bg-transparent",
                    "text-foreground/55",
                    "hover:text-white",
                    "hover:[background:var(--lumina-surface-interactive)]",
                    "hover:[border-color:var(--lumina-border-standard)]",
                  ),
            )}
          >
            {option.dotClassName && (
              <span
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-200",
                  option.dotClassName,
                  active
                    ? "opacity-100 scale-110 [filter:drop-shadow(var(--lumina-glow-surface))]"
                    : "opacity-55",
                )}
              />
            )}

            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
