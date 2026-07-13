interface AppearanceSliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;

  onChange(value: number): void;
}

export function AppearanceSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  onChange,
}: AppearanceSliderProps) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm">
          {label}
        </span>

        <span className="text-xs tabular-nums text-muted-foreground">
          {value}
        </span>
      </div>

      <input
        className="
          w-full
          cursor-pointer
          accent-[var(--lumina-accent-color)]
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onChange(
            Number(
              event.currentTarget.value,
            ),
          );
        }}
      />
    </label>
  );
}
