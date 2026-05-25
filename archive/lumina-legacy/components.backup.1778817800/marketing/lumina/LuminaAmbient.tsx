"use client";

import type { CSSProperties } from "react";
import { LUMINA_TOKENS } from "./LuminaTokens";

export type LuminaAmbientProps = {
  className?: string;
  opacity?: number;
  disableAnimation?: boolean;
};

export default function LuminaAmbient({
  className = "",
  opacity,
  disableAnimation = false,
}: LuminaAmbientProps) {
  // Safe fallbacks in case tokens are incomplete.
  const ambient =
    "ambient" in LUMINA_TOKENS
      ? LUMINA_TOKENS.ambient
      : {
          blur: 120,
          scale: 1,
          opacity: 0.55,
        };

  const animation =
    "animation" in LUMINA_TOKENS
      ? LUMINA_TOKENS.animation
      : {
          duration: 18,
          ease: "ease-in-out",
        };

  const asset =
    "asset" in LUMINA_TOKENS
      ? LUMINA_TOKENS.asset
      : {
          defaultSrc: "/lumina/lumina-orb.png",
        };

  const finalOpacity =
    opacity ?? ambient.opacity ?? 0.55;

  const style: CSSProperties = {
    opacity: finalOpacity,
    filter: `blur(${ambient.blur ?? 120}px)`,
    transform: `scale(${ambient.scale ?? 1})`,
    backgroundImage: `url(${asset.defaultSrc})`,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
    pointerEvents: "none",
  };

  if (!disableAnimation) {
    style.animation = `lumina-float ${
      animation.duration ?? 18
    }s ${animation.ease ?? "ease-in-out"} infinite`;
  }

  const baseScale = ambient.scale ?? 1;

  return (
    <>
      <div
        className={`absolute inset-0 ${className}`}
        style={style}
        aria-hidden="true"
      />

      {!disableAnimation && (
        <style jsx>{`
          @keyframes lumina-float {
            0% {
              transform: scale(${baseScale})
                translate3d(0, 0, 0);
            }
            50% {
              transform: scale(${baseScale})
                translate3d(0, -12px, 0);
            }
            100% {
              transform: scale(${baseScale})
                translate3d(0, 0, 0);
            }
          }
        `}</style>
      )}
    </>
  );
}
