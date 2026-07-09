import {
  cn,
} from "@/lib/utils";

import {
  useSlider,
} from "./useSlider";

import type {
  LuminaValueInputProps,
} from "../core";

export interface LuminaSliderProps
  extends LuminaValueInputProps<number> {
  min: number;
  max: number;
  step?: number;
}

export function LuminaSlider({
  value,
  min,
  max,
  step = 1,
  disabled,
  className,
  onValueChange,
}: LuminaSliderProps) {
  const slider =
    useSlider({
      value,
      min,
      max,
      step,
      onValueChange,
    });

  return (
    <input
      type="range"
      value={slider.value}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onChange={(e) =>
        slider.setValue(
          Number(
            e.target.value,
          ),
        )
      }
      className={cn(
        "w-full accent-violet",
        className,
      )}
    />
  );
}
