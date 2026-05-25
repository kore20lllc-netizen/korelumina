"use client";

export type LuminaThinkingProps = {
  mode?: string;
  size?: number;
  className?: string;
};

export function LuminaThinking({
  size = 32,
  className = "",
}: LuminaThinkingProps) {
  return (
    <div
      className={`animate-pulse rounded-full bg-gradient-to-br from-blue-500 to-amber-400 ${className}`}
      style={{
        width: size,
        height: size,
      }}
    />
  );
}

export { default as LuminaAmbient } from "@/components/lumina/LuminaAmbient";
export { LuminaCore } from "@/components/lumina/LuminaCore";
export { LuminaMark } from "@/components/lumina/LuminaMark";
export { LUMINA_TOKENS } from "@/components/lumina/LuminaTokens";
