import type { ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

export function LuminaGlassLayer({
  children,
}: Props) {
  return (
    <>
      <div className="absolute inset-0 bg-[#07080d]/58 backdrop-blur-[2px]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,6,10,.18),rgba(5,6,10,.58))]" />

      {children}
    </>
  );
}
