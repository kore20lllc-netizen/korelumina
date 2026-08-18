import type {
  ReactNode,
} from "react";

interface KnowledgeStageLaneProps {
  title: string;
  index: number;
  total: number;
  children: ReactNode;
}

export function KnowledgeStageLane({
  title,
  index,
  total,
  children,
}: KnowledgeStageLaneProps) {
  const first =
    index === 0;

  const last =
    index === total - 1;

  return (
    <section className="relative flex min-w-0 flex-col">
      <header className="flex h-12 items-start justify-center px-2">
        <div
          className="
            max-w-full
            truncate
            rounded-full
            border
            border-white/[0.10]
            bg-slate-950/45
            px-3
            py-2
            text-[10px]
            font-medium
            uppercase
            tracking-[0.28em]
            text-slate-200
            backdrop-blur-xl
          "
        >
          {title}
        </div>
      </header>

      <div
        className="
          relative
          h-10
          shrink-0
        "
        aria-hidden="true"
      >
        <div
          className={[
            "absolute top-1/2 h-px -translate-y-1/2",
            "bg-gradient-to-r from-cyan-300/15 via-cyan-300/55 to-cyan-300/15",
            first
              ? "left-1/2 right-0"
              : last
                ? "left-0 right-1/2"
                : "inset-x-0",
          ].join(" ")}
        />

        <div
          className="
            absolute
            left-1/2
            top-1/2
            flex
            h-5
            w-5
            -translate-x-1/2
            -translate-y-1/2
            items-center
            justify-center
            rounded-full
            border
            border-cyan-200/35
            bg-slate-950
            shadow-[0_0_18px_rgba(34,211,238,0.25)]
          "
        >
          <div
            className="
              h-2
              w-2
              rounded-full
              bg-cyan-300
              shadow-[0_0_12px_rgba(103,232,249,0.9)]
            "
          />
        </div>
      </div>

      <div className="px-2 pb-2">
        <div
          className="
            min-h-[350px]
            rounded-2xl
            border
            border-white/[0.07]
            bg-white/[0.018]
            p-3
            backdrop-blur-sm
          "
        >
          <div className="flex flex-col gap-3">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
