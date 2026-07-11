import type { ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

export function LuminaGlassLayer({
  children,
}: Props) {
  return (
    <>
      <div
        className={[
          "absolute inset-0",
          "[background:var(--lumina-tint-overlay)]",
          "[backdrop-filter:var(--lumina-blur-surface)]",
        ].join(" ")}
      />

      <div
        className={[
          "absolute inset-0",
          "[background:var(--lumina-highlight-overlay)]",
        ].join(" ")}
      />

      {children}
    </>
  );
}

export default LuminaGlassLayer;
