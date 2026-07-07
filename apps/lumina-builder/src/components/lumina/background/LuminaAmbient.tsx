import type { ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

export function LuminaAmbient({ children }: Props) {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(124,92,255,.22),transparent_40%)]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(0,220,255,.12),transparent_35%)]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(124,92,255,.10),transparent_55%)]" />

      {children}
    </>
  );
}
