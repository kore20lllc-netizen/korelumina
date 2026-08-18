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
  "border-blue-400/70 ring-1 ring-inset ring-cyan-300/20",
  "bg-slate-950/48",
  "shadow-[0_0_0_1px_rgba(59,130,246,.16),0_0_30px_rgba(37,99,235,.16),0_28px_80px_rgba(0,0,0,.34),inset_0_0_22px_rgba(56,189,248,.05)]",
].join(" ");

const interactiveBackdropClasses =
  "backdrop-blur-[44px] backdrop-saturate-[170%]";

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

function AmbientMaterial() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_2%,rgba(124,58,237,.30),transparent_36%),radial-gradient(circle_at_29%_42%,rgba(217,119,6,.17),transparent_27%),radial-gradient(circle_at_74%_64%,rgba(67,56,202,.13),transparent_30%),radial-gradient(circle_at_91%_14%,rgba(34,211,238,.035),transparent_22%),radial-gradient(circle_at_57%_86%,rgba(236,72,153,.075),transparent_18%),linear-gradient(180deg,rgba(255,255,255,.018),transparent_24%,rgba(2,6,23,.10))]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[7%] top-0 h-px opacity-90 [background:linear-gradient(90deg,transparent_0%,rgba(96,165,250,.10)_12%,rgba(247,215,116,.42)_34%,rgba(255,255,255,.62)_50%,rgba(125,211,252,.28)_69%,rgba(59,130,246,.08)_88%,transparent_100%)] [box-shadow:0_0_22px_rgba(125,211,252,.14),0_0_40px_rgba(247,215,116,.08)]"
      />
    </>
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
    as === "button" &&
      interactiveBackdropClasses,
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
        <AmbientMaterial />
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
      <AmbientMaterial />
      {children}
    </button>
  );
}
