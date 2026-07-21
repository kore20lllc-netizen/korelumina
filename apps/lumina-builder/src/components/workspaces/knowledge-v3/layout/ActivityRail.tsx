import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Binary,
  BookOpenCheck,
  Database,
  FileSearch,
  GitBranch,
} from "lucide-react";

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

const ITEMS: ActivityItem[] = [
  {
    id: "sources",
    title: "Sources",
    subtitle: "Waiting",
    icon: Database,
  },
  {
    id: "evidence",
    title: "Evidence",
    subtitle: "Pending",
    icon: FileSearch,
  },
  {
    id: "compiler",
    title: "Compiler",
    subtitle: "Idle",
    icon: Binary,
  },
  {
    id: "knowledge",
    title: "Knowledge",
    subtitle: "Not Published",
    icon: BookOpenCheck,
  },
  {
    id: "graph",
    title: "Knowledge Graph",
    subtitle: "Offline",
    icon: GitBranch,
  },
];

export function ActivityRail() {
  return (
    <section
      className="
        flex
        h-full
        flex-col
        rounded-[28px]
        border
        border-white/10
        bg-slate-950/42
        shadow-[0_18px_60px_rgba(0,0,0,.32),0_1px_0_rgba(255,255,255,.05)_inset]
        backdrop-blur-2xl
      "
    >
      <header
        className="
          border-b
          border-white/8
          px-5
          py-5
        "
      >
        <div className="flex items-center gap-3">
          <span
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-2xl
              border
              border-cyan-300/15
              bg-cyan-400/10
            "
          >
            <Activity className="h-5 w-5 text-cyan-100" />
          </span>

          <div>
            <h2
              className="
                text-sm
                font-semibold
                text-white
              "
            >
              Activity
            </h2>

            <p
              className="
                text-xs
                text-white/45
              "
            >
              Production Timeline
            </p>
          </div>
        </div>
      </header>

      <div
        className="
          flex-1
          overflow-y-auto
          px-4
          py-4
        "
      >
        <div className="space-y-3">
          {ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.id}
                className="
                  group
                  rounded-2xl
                  border
                  border-white/8
                  bg-white/[0.04]
                  p-4
                  transition-all
                  duration-200
                  hover:border-white/15
                  hover:bg-white/[0.07]
                "
              >
                <div className="flex items-start gap-3">
                  <span
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-white/8
                      bg-white/[0.05]
                    "
                  >
                    <Icon className="h-5 w-5 text-white/65" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3
                      className="
                        truncate
                        text-sm
                        font-semibold
                        text-white
                      "
                    >
                      {item.title}
                    </h3>

                    <p
                      className="
                        mt-1
                        text-xs
                        text-white/45
                      "
                    >
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <footer
        className="
          border-t
          border-white/8
          px-5
          py-4
        "
      >
        <p
          className="
            text-[11px]
            leading-5
            text-white/40
          "
        >
          Runtime events, compiler activity, validation results and
          publication history will appear here.
        </p>
      </footer>
    </section>
  );
}
