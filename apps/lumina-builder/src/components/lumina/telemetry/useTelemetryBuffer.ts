import {
  useCallback,
  useMemo,
  useState,
} from "react";

import type {
  TelemetryBufferOptions,
  TelemetrySample,
} from "./types";

const DEFAULT_CAPACITY = 180;

export function useTelemetryBuffer(
  options: TelemetryBufferOptions = {},
) {
  const capacity =
    options.capacity ??
    DEFAULT_CAPACITY;

  const [samples, setSamples] =
    useState<TelemetrySample[]>([]);

  const push = useCallback(
    (value: number) => {
      setSamples((current) => {
        const next = [
          ...current,
          {
            value,
            timestamp: Date.now(),
          },
        ];

        if (
          next.length <= capacity
        ) {
          return next;
        }

        return next.slice(
          next.length - capacity,
        );
      });
    },
    [capacity],
  );

  const clear =
    useCallback(() => {
      setSamples([]);
    }, []);

  const values = useMemo(
    () =>
      samples.map(
        (sample) => sample.value,
      ),
    [samples],
  );

  return {
    samples,
    values,
    push,
    clear,
    capacity,
  };
}
