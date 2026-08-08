import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";

import {
  cn,
} from "@/lib/utils";

interface SharedProps {
  children: ReactNode;
  selected?: boolean;
  interactive?: boolean;
  className?: string;
}

type LuminaFlagshipCardProps =
  | (
      SharedProps &
      ButtonHTMLAttributes<HTMLButtonElement> & {
        as?: "button";
      }
    )
  | (
      SharedProps &
      HTMLAttributes<HTMLElement> & {
        as: "article";
      }
    );

const baseClasses = [
  "relative overflow-hidden rounded-[22px] border",
  "border-cyan-300/60",
  "bg-[linear-gradient(135deg,rgba(3,12,35,0.68),rgba(17,10,45,0.62),rgba(3,14,37,0.66))]",
  "ring-1 ring-inset ring-blue-400/36",
  "shadow-[inset_0_1px_0_rgba(186,230,253,0.07),0_0_18px_rgba(37,99,235,0.10),0_14px_34px_rgba(2,6,23,0.20)]",
].join(" ");

const interactiveClasses = [
  "transition-[transform,border-color,background-color,box-shadow] duration-200",
  "hover:-translate-y-0.5",
  "hover:border-cyan-200/78",
  "hover:ring-blue-300/52",
  "hover:bg-[linear-gradient(135deg,rgba(5,18,48,0.76),rgba(23,13,58,0.70),rgba(4,19,49,0.74))]",
  "hover:shadow-[inset_0_1px_0_rgba(186,230,253,0.08),0_0_24px_rgba(37,99,235,0.14),0_18px_42px_rgba(2,6,23,0.34)]",
  "motion-reduce:transform-none",
  "motion-reduce:transition-none",
].join(" ");

const selectedClasses = [
  "border-cyan-100/88",
  "bg-[radial-gradient(circle_at_14%_0%,rgba(34,211,238,0.13),transparent_42%),linear-gradient(135deg,rgba(6,22,55,0.82),rgba(28,15,65,0.76),rgba(5,24,58,0.80))]",
  "ring-cyan-100/24",
  "shadow-[0_0_0_1px_rgba(125,211,252,0.22),0_0_32px_rgba(34,211,238,0.16),0_18px_44px_rgba(2,6,23,0.36)]",
].join(" ");

const focusClasses = [
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-cyan-300/55",
  "focus-visible:ring-offset-2",
  "focus-visible:ring-offset-slate-950",
].join(" ");

function Highlight() {
  return (
    <div
      aria-hidden="true"
      className="
        pointer-events-none absolute inset-x-6 top-0 h-px
        bg-gradient-to-r
        from-transparent via-cyan-100/80 to-transparent
      "
    />
  );
}

export function LuminaFlagshipCard(
  props: LuminaFlagshipCardProps,
) {
  const {
    children,
    selected = false,
    interactive = false,
    className,
    as = "button",
    ...rest
  } = props;

  const classes = cn(
    baseClasses,
    interactive && interactiveClasses,
    selected && selectedClasses,
    as === "button" && focusClasses,
    className,
  );

  if (as === "article") {
    return (
      <article
        className={classes}
        {...(rest as HTMLAttributes<HTMLElement>)}
      >
        <Highlight />
        {children}
      </article>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      <Highlight />
      {children}
    </button>
  );
}
