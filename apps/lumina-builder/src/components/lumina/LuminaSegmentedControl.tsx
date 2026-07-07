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
        "inline-flex items-center gap-1 rounded-2xl border border-white/10",
        "bg-[linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03))]",
        "backdrop-blur-xl",
        "p-1",
        "shadow-[0_18px_40px_-20px_rgba(0,0,0,.60),inset_0_1px_0_rgba(255,255,255,.08)]",
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
                    option.activeClassName ??
                      "border-violet/30 bg-[linear-gradient(180deg,hsl(258_100%_74%),hsl(250_72%_56%))] text-white",
                    "shadow-[0_10px_28px_-10px_rgba(124,92,255,.70),inset_0_1px_0_rgba(255,255,255,.25)]",
                    "-translate-y-[1px]",
                  )
                : "border-transparent bg-transparent text-foreground/55 hover:text-white hover:bg-white/[0.06] hover:border-white/10",
            )}
          >
            {option.dotClassName && (
              <span
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-200",
                  option.dotClassName,
                  active
                    ? "opacity-100 shadow-[0_0_10px_currentColor] scale-110"
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
