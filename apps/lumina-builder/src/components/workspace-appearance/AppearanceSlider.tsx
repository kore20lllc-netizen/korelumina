interface AppearanceSliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
}

export function AppearanceSlider({
  label,
  value,
  min = 0,
  max = 100,
}: AppearanceSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm">
          {label}
        </span>

        <span className="text-xs text-muted-foreground">
          {value}
        </span>
      </div>

      <input
        className="w-full accent-violet-400"
        type="range"
        min={min}
        max={max}
        value={value}
        readOnly
      />
    </div>
  );
}
