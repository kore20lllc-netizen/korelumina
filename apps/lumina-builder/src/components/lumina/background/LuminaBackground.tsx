import type { ReactNode } from "react";

import luminaBackground from "@/assets/optimized/lumina.webp";

import {
  workspaceThemes,
  type LuminaWorkspaceTheme,
} from "@/components/lumina/theme";

import { LuminaAmbient } from "./LuminaAmbient";
import { LuminaGlassLayer } from "./LuminaGlassLayer";

interface Props {
  children: ReactNode;
  theme?: LuminaWorkspaceTheme;
}

export function LuminaBackground({
  children,
  theme = "knowledge",
}: Props) {
  const themeDefinition = workspaceThemes[theme];

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${luminaBackground})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      />

      <LuminaAmbient theme={themeDefinition.ambient} />

      <LuminaGlassLayer theme={themeDefinition.surface} />

      <main className="relative z-10 h-full overflow-auto">
        {children}
      </main>
    </div>
  );
}
