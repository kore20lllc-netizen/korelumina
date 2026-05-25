"use client";

import type { CSSProperties } from "react";
import { LUMINA_TOKENS } from "./LuminaTokens";
import type { LuminaCoreProps } from "./types";

export function LuminaCore({
  className = "",
  opacity,
  disableAnimation = false,
}: LuminaCoreProps) {
  // Defensive fallback so the component still works even if tokens are partial.
  const tokens = LUMINA_TOKENS as any;

  const core = tokens.core ?? {
    size: 160,
    opacity: 1,
    scale: 1,
    blur: 0,
  };

  const animation = tokens.animation ?? {
    duration: 18,
    ease: "ease-in-out",
  };

  const asset = tokens.asset ?? {
    defaultSrc: "/lumina/lumina-orb.png",
  };

  const finalOpacity = opacity ?? core.opacity ?? 1;
  const baseScale = core.scale ?? 1;
  const size = core.size ?? 160;

  const style: CSSProperties = {
    width: size,
    height: size,
    opacity: finalOpacity,
    filter: `blur(${core.blur ?? 0}px)`,
    transform: `scale(${baseScale})`,
    backgroundImage: `url(${asset.defaultSrc})`,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
    pointerEvents: "none",
  };

  if (!disableAnimation) {
    style.animation = `lumina-core-pulse ${
      animation.duration ?? 18
    }s ${animation.ease ?? "ease-in-out"} infinite`;
  }

  return (
    <>
      <div
        className={`relative ${className}`}
        style={style}
        aria-hidden="true"
      />

      {!disableAnimation && (
        <style jsx>{`
          @keyframes lumina-core-pulse {
            0% {
              transform: scale(${baseScale});
              opacity: ${finalOpacity};
            }
            50% {
              transform: scale(${baseScale * 1.04});
              opacity: ${Math.min(finalOpacity + 0.08, 1)};
            }
            100% {
              transform: scale(${baseScale});
              opacity: ${finalOpacity};
            }
          }
        `}</style>
      )}
    </>
  );
}

export default LuminaCore;
