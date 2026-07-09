import {
  useCallback,
} from "react";

export interface UseSliderProps {
  min: number;
  max: number;
  step: number;
  value: number;

  onValueChange(
    value: number,
  ): void;
}

export function useSlider({
  min,
  max,
  step,
  value,
  onValueChange,
}: UseSliderProps) {
  const setValue =
    useCallback(
      (next: number) => {
        const clamped =
          Math.min(
            max,
            Math.max(min, next),
          );

        const snapped =
          Math.round(
            clamped / step,
          ) * step;

        onValueChange(snapped);
      },
      [
        min,
        max,
        step,
        onValueChange,
      ],
    );

  return {
    value,
    setValue,
  };
}
