import type { PropsWithChildren } from "react";

export function LuminaMetricGrid(
  { children }: PropsWithChildren,
) {
  return <div className="grid gap-4">{children}</div>;
}
