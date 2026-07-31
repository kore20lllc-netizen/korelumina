import type { PropsWithChildren, ReactNode } from "react";

interface Props extends PropsWithChildren {
  title?: ReactNode;
}

export function ExecutiveSection({
  title,
  children,
}: Props) {
  return (
    <section className="space-y-5">
      {title ? (
        <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
          {title}
        </h3>
      ) : null}

      {children}
    </section>
  );
}
