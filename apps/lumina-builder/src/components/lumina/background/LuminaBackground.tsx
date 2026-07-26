import type { ReactNode } from "react";

import luminaBackground from "@/assets/optimized/lumina.webp";

import type {
  LuminaWorkspaceTheme,
} from "@/components/lumina/theme";

import { LuminaAmbient } from "./LuminaAmbient";
import { LuminaGlassLayer } from "./LuminaGlassLayer";

interface Props {
  children: ReactNode;
  theme?: LuminaWorkspaceTheme;
}

export function LuminaBackground({
  children,
}: Props) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      />

      <LuminaAmbient />

      <LuminaGlassLayer />

      <main className="relative z-10 h-full overflow-auto">
        {children}
      </main>
    </div>
  );
}

export default LuminaBackground;
