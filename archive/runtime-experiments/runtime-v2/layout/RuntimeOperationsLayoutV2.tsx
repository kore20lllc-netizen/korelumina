import type {
  ReactNode,
} from "react";

import {
  cn,
} from "@/lib/utils";

export interface RuntimeOperationsLayoutV2Props {
  header: ReactNode;
  toolbar?: ReactNode;
  fleet: ReactNode;
  operations: ReactNode;
  inspector: ReactNode;
  className?: string;
}

export function RuntimeOperationsLayoutV2({
  header,
  toolbar,
  fleet,
  operations,
  inspector,
  className,
}: RuntimeOperationsLayoutV2Props) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div
        className={cn(
          "mx-auto flex max-w-[1800px] flex-col gap-7 px-4 py-8 md:px-8 xl:px-10",
          className,
        )}
      >
        <section
          aria-label="Runtime executive overview"
          className="min-w-0"
        >
          {header}
        </section>

        {toolbar && (
          <section
            aria-label="Runtime command controls"
            className="min-w-0"
          >
            {toolbar}
          </section>
        )}

        <section
          aria-label="Runtime operations command center"
          className="overflow-hidden rounded-[var(--lumina-radius-panel)] border border-[var(--lumina-border-subtle)] [background:var(--lumina-surface-panel)]"
        >
          <div className="grid min-h-[34rem] grid-cols-1 xl:h-[clamp(34rem,68vh,48rem)] xl:grid-cols-[320px_minmax(0,1fr)_400px]">
            <aside
              aria-label="Runtime fleet"
              className="min-w-0 border-b border-[var(--lumina-border-subtle)] xl:border-b-0 xl:border-r"
            >
              {fleet}
            </aside>

            <main
              aria-label="Runtime activity"
              className="min-w-0 border-b border-[var(--lumina-border-subtle)] xl:border-b-0 xl:border-r"
            >
              {operations}
            </main>

            <aside
              aria-label="Runtime inspector"
              className="min-w-0"
            >
              {inspector}
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
}

export default RuntimeOperationsLayoutV2;
