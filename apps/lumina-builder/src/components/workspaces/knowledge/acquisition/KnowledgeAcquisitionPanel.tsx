import {
  BookOpen,
  FileText,
  GitBranch,
  MessageSquareText,
  RadioTower,
} from "lucide-react";

interface Props {
  acquisition: unknown;
}

const SOURCES = [
  {
    title: "Conversations",
    subtitle: "Engineering discussions",
    icon: MessageSquareText,
    queued: 14,
    processing: 3,
    completed: 218,
  },
  {
    title: "Repositories",
    subtitle: "Git evidence",
    icon: GitBranch,
    queued: 4,
    processing: 1,
    completed: 37,
  },
  {
    title: "Documentation",
    subtitle: "Architecture & specifications",
    icon: FileText,
    queued: 9,
    processing: 2,
    completed: 94,
  },
  {
    title: "Runtime",
    subtitle: "Operational telemetry",
    icon: RadioTower,
    queued: 2,
    processing: 1,
    completed: 62,
  },
  {
    title: "Knowledge",
    subtitle: "Existing institutional memory",
    icon: BookOpen,
    queued: 0,
    processing: 0,
    completed: 143,
  },
];

export function KnowledgeAcquisitionPanel(_: Props) {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Evidence Sources
        </div>

        <h2 className="mt-2 text-xl font-semibold">
          Knowledge Acquisition
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Organizational evidence entering the preservation pipeline.
        </p>
      </div>

      <div className="mt-6 flex-1 space-y-3">
        {SOURCES.map((source) => {
          const Icon = source.icon;

          return (
            <div
              key={source.title}
              className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition-colors hover:border-white/20"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {source.title}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {source.subtitle}
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl border border-white/10 p-2">
                      <div className="text-lg font-semibold">
                        {source.queued}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Queued
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 p-2">
                      <div className="text-lg font-semibold">
                        {source.processing}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Active
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 p-2">
                      <div className="text-lg font-semibold">
                        {source.completed}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Stored
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
