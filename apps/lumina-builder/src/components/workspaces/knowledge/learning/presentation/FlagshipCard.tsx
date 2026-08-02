import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";

import {
  cn,
} from "@/lib/utils";

import {
  flagshipAppearance,
} from "./flagshipAppearance";

interface SharedProps {
  children: ReactNode;
  selected?: boolean;
  interactive?: boolean;
  className?: string;
}

type FlagshipCardProps =
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

export function FlagshipCard(
  props: FlagshipCardProps,
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
    flagshipAppearance.card,
    interactive &&
      flagshipAppearance.cardInteractive,
    selected &&
      flagshipAppearance.cardSelected,
    className,
  );

  if (as === "article") {
    return (
      <article
        className={classes}
        {...(rest as HTMLAttributes<HTMLElement>)}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/80 to-transparent"
        />

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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/80 to-transparent"
      />

      {children}
    </button>
  );
}
