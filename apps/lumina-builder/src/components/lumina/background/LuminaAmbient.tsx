export function LuminaAmbient() {
  return (
    <>
      <div
        aria-hidden
        className={[
          "absolute inset-0",
          "[background:radial-gradient(circle_at_18%_18%,var(--lumina-ambient-primary),transparent_34%),radial-gradient(circle_at_82%_18%,var(--lumina-ambient-secondary),transparent_36%)]",
          "[opacity:var(--lumina-ambient-opacity)]",
        ].join(" ")}
      />

      <div
        aria-hidden
        className={[
          "absolute inset-0",
          "[background:var(--lumina-highlight-overlay)]",
        ].join(" ")}
      />
    </>
  );
}

export default LuminaAmbient;
