import type {
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export interface LuminaExecutiveIdentityProps {
  eyebrow: ReactNode;
  badge?: ReactNode;
  titlePrimary: ReactNode;
  titleSecondary?: ReactNode;
  description?: ReactNode;
  className?: string;
}

export function LuminaExecutiveIdentity({
  eyebrow,
  badge,
  titlePrimary,
  titleSecondary,
  description,
  className,
}: LuminaExecutiveIdentityProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        {eyebrow}
        {badge}
      </div>

      <h1 className="text-5xl font-black tracking-[-0.045em] sm:text-6xl">
        <span className="text-gradient-lumina">
          {titlePrimary}
        </span>

        {titleSecondary ? (
          <>
            {" "}
            <span className="bg-gradient-to-r from-[#D9A441] via-[#B97A18] to-[#7A4B05] bg-clip-text text-transparent">
              {titleSecondary}
            </span>
          </>
        ) : null}
      </h1>

      {description ? (
        <p className="mt-6 max-w-2xl text-base leading-7 text-white/78">
          {description}
        </p>
      ) : null}
    </div>
  );
}
