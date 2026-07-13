import { cn } from "@/lib/utils";

const SIZE = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-4xl",
  hero: "text-[56px]",
} as const;

export type LuminaBrandVariant =
  | "default"
  | "monochrome";

export interface LuminaBrandProps {
  size?: keyof typeof SIZE;
  variant?: LuminaBrandVariant;
  className?: string;
}

const LUMINA_GRADIENT =
  "linear-gradient(90deg,#7C5CFF 0%,#9757FF 28%,#C34CFF 58%,#5AC8FF 100%)";

export function LuminaBrand({
  size = "md",
  variant = "default",
  className,
}: LuminaBrandProps) {
  const gradientStyle =
    variant === "default"
      ? {
          background: LUMINA_GRADIENT,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
          filter:
            "drop-shadow(0 0 10px rgba(124,92,255,.18))",
        }
      : undefined;

  return (
    <h1
      className={cn(
        "select-none",
        "leading-none",
        "font-black",
        "tracking-[-0.035em]",
        SIZE[size],
        className,
      )}
    >
      <span className="font-extrabold text-white">
        Kore
      </span>

      <span
        className={cn(
          "relative -top-[0.02em] -ml-[0.03em] inline font-black",
          variant === "monochrome" &&
            "text-white",
        )}
        style={gradientStyle}
      >
        Lumina
      </span>
    </h1>
  );
}

export default LuminaBrand;
