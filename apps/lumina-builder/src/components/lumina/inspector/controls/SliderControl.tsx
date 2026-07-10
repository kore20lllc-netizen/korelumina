import type {
  LuminaInspectorSliderControlModel,
} from "../model";

export function SliderControl({
  control,
}: {
  control: LuminaInspectorSliderControlModel;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          {control.label}
        </div>

        <div className="text-xs text-muted-foreground">
          {control.value}
        </div>
      </div>

      {control.description && (
        <div className="text-xs text-muted-foreground">
          {control.description}
        </div>
      )}

      <input
        type="range"
        min={control.min}
        max={control.max}
        step={control.step ?? 1}
        value={control.value}
        disabled={control.disabled}
        readOnly
        className="w-full accent-violet-400"
      />
    </div>
  );
}
