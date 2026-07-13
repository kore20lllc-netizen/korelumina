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
        aria-hidden
        className={[
          "pointer-events-none absolute inset-0",
          "[background:var(--lumina-tint-overlay)]",
          "[opacity:var(--lumina-material-layer-opacity)]",
          "[backdrop-filter:var(--lumina-blur-surface)_var(--lumina-material-saturation)_var(--lumina-material-contrast)_var(--lumina-material-brightness)]",
          "[transform:translateY(calc(var(--lumina-elevation-level)*-0.5px))]",
          "transition-[opacity,transform,backdrop-filter] duration-300",
          "will-change-[opacity,transform,backdrop-filter]",
        ].join(" ")}
      />

      <div
        aria-hidden
        className={[
          "pointer-events-none absolute inset-0",
          "[background:var(--lumina-highlight-overlay)]",
          "[opacity:calc(var(--lumina-material-layer-opacity)*(0.85+var(--lumina-elevation-level)*0.15))]",
          "transition-opacity duration-300",
        ].join(" ")}
      />

      {children}
    </>
  );
}

export default LuminaGlassLayer;
